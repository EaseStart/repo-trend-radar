package github

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	gh "github.com/google/go-github/v60/github"
	"github.com/shurcooL/githubv4"
	"golang.org/x/oauth2"
)

// Client wraps both GitHub REST and GraphQL clients with rate limiting.
type Client struct {
	rest    *gh.Client
	graphql *githubv4.Client
	limiter *RateLimiter
	token   string
}

// NewClient creates a new GitHub client with the provided token.
func NewClient(token string) *Client {
	ctx := context.Background()
	ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: token})
	tc := oauth2.NewClient(ctx, ts)

	return &Client{
		rest:    gh.NewClient(tc),
		graphql: githubv4.NewClient(tc),
		limiter: NewRateLimiter(),
		token:   token,
	}
}

// SearchRepos discovers repos by topic within a star range.
func (c *Client) SearchRepos(ctx context.Context, topic string, minStars, maxStars int) ([]*gh.Repository, error) {
	c.limiter.WaitIfNeeded("search")

	query := fmt.Sprintf("topic:%s stars:%d..%d pushed:>%s",
		topic, minStars, maxStars,
		time.Now().AddDate(0, 0, -30).Format("2006-01-02"))

	opts := &gh.SearchOptions{
		Sort:  "stars",
		Order: "desc",
		ListOptions: gh.ListOptions{
			PerPage: 100,
		},
	}

	result, resp, err := c.rest.Search.Repositories(ctx, query, opts)
	if resp != nil {
		c.limiter.Update("search", resp.Header)
	}
	if err != nil {
		return nil, fmt.Errorf("search repos (topic=%s): %w", topic, err)
	}

	return result.Repositories, nil
}

// RepoMetrics holds the metrics fetched via GraphQL.
type RepoMetrics struct {
	ID         int64
	Owner      string
	Name       string
	Stars      int
	Forks      int
	OpenIssues int
	Watchers   int
	PushedAt   time.Time
	Topics     []string
}

// BatchFetchRepos fetches metrics for multiple repos in a single GraphQL query.
// Due to GraphQL limitations, we use individual queries in a loop (aliased batch
// queries require dynamic schema which githubv4 doesn't support well).
func (c *Client) BatchFetchRepos(ctx context.Context, repos []RepoIdentifier) ([]RepoMetrics, error) {
	var results []RepoMetrics

	for _, r := range repos {
		c.limiter.WaitIfNeeded("graphql")

		var query struct {
			Repository struct {
				DatabaseID     int64
				StargazerCount int
				ForkCount      int
				Issues         struct {
					TotalCount int
				} `graphql:"issues(states: OPEN)"`
				Watchers struct {
					TotalCount int
				}
				PushedAt         githubv4.DateTime
				RepositoryTopics struct {
					Nodes []struct {
						Topic struct {
							Name string
						}
					}
				} `graphql:"repositoryTopics(first: 20)"`
			} `graphql:"repository(owner: $owner, name: $name)"`
		}

		vars := map[string]interface{}{
			"owner": githubv4.String(r.Owner),
			"name":  githubv4.String(r.Name),
		}

		err := c.graphql.Query(ctx, &query, vars)
		if err != nil {
			log.Printf("GraphQL error for %s/%s: %v", r.Owner, r.Name, err)
			continue
		}

		topics := make([]string, 0, len(query.Repository.RepositoryTopics.Nodes))
		for _, n := range query.Repository.RepositoryTopics.Nodes {
			topics = append(topics, n.Topic.Name)
		}

		results = append(results, RepoMetrics{
			ID:         query.Repository.DatabaseID,
			Owner:      r.Owner,
			Name:       r.Name,
			Stars:      query.Repository.StargazerCount,
			Forks:      query.Repository.ForkCount,
			OpenIssues: query.Repository.Issues.TotalCount,
			Watchers:   query.Repository.Watchers.TotalCount,
			PushedAt:   query.Repository.PushedAt.Time,
			Topics:     topics,
		})
	}

	return results, nil
}

// RepoIdentifier holds owner/name pair for batch queries.
type RepoIdentifier struct {
	Owner string
	Name  string
}

// ParseFullName splits "owner/name" into RepoIdentifier.
func ParseFullName(fullName string) RepoIdentifier {
	parts := strings.SplitN(fullName, "/", 2)
	if len(parts) != 2 {
		return RepoIdentifier{}
	}
	return RepoIdentifier{Owner: parts[0], Name: parts[1]}
}

// FetchREADME gets raw README content and SHA for change detection.
func (c *Client) FetchREADME(ctx context.Context, owner, name string) (content string, sha string, err error) {
	c.limiter.WaitIfNeeded("rest")

	readme, resp, err := c.rest.Repositories.GetReadme(ctx, owner, name, nil)
	if resp != nil {
		c.limiter.Update("rest", resp.Header)
	}
	if err != nil {
		return "", "", fmt.Errorf("fetch readme %s/%s: %w", owner, name, err)
	}

	decoded, err := readme.GetContent()
	if err != nil {
		return "", "", fmt.Errorf("decode readme %s/%s: %w", owner, name, err)
	}

	return decoded, readme.GetSHA(), nil
}

// ContributorCount gets total contributor count using the Link header trick.
func (c *Client) ContributorCount(ctx context.Context, owner, name string) (int, error) {
	c.limiter.WaitIfNeeded("rest")

	opts := &gh.ListContributorsOptions{
		ListOptions: gh.ListOptions{PerPage: 1},
	}

	_, resp, err := c.rest.Repositories.ListContributors(ctx, owner, name, opts)
	if resp != nil {
		c.limiter.Update("rest", resp.Header)
	}
	if err != nil {
		return 0, fmt.Errorf("list contributors %s/%s: %w", owner, name, err)
	}

	if resp.LastPage > 0 {
		return resp.LastPage, nil
	}
	return 1, nil
}

// --- Rate Limiter ---

// RateLimiter tracks API rate limits across REST, Search, and GraphQL.
type RateLimiter struct {
	limits map[string]*limitState
	mu     sync.Mutex
}

type limitState struct {
	remaining int
	reset     time.Time
	total     int
}

// NewRateLimiter creates a fresh rate limiter.
func NewRateLimiter() *RateLimiter {
	return &RateLimiter{
		limits: map[string]*limitState{
			"rest":    {remaining: 5000, total: 5000},
			"search":  {remaining: 30, total: 30},
			"graphql": {remaining: 5000, total: 5000},
		},
	}
}

// WaitIfNeeded blocks if approaching rate limit (20% remaining).
func (r *RateLimiter) WaitIfNeeded(apiType string) {
	r.mu.Lock()
	defer r.mu.Unlock()

	state, ok := r.limits[apiType]
	if !ok {
		return
	}

	threshold := state.total / 5 // 20%
	if state.remaining <= threshold && time.Now().Before(state.reset) {
		waitDuration := time.Until(state.reset) + time.Second
		log.Printf("⏳ Rate limit low for %s (%d remaining), waiting %s...", apiType, state.remaining, waitDuration)
		r.mu.Unlock()
		time.Sleep(waitDuration)
		r.mu.Lock()
	}
}

// Update updates limits from GitHub response headers.
func (r *RateLimiter) Update(apiType string, headers http.Header) {
	r.mu.Lock()
	defer r.mu.Unlock()

	state, ok := r.limits[apiType]
	if !ok {
		return
	}

	if v := headers.Get("X-RateLimit-Remaining"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			state.remaining = n
		}
	}

	if v := headers.Get("X-RateLimit-Reset"); v != "" {
		if n, err := strconv.ParseInt(v, 10, 64); err == nil {
			state.reset = time.Unix(n, 0)
		}
	}
}

// TotalAPICalls returns approximate total calls made (for logging).
func (r *RateLimiter) TotalAPICalls() int {
	r.mu.Lock()
	defer r.mu.Unlock()

	total := 0
	for _, s := range r.limits {
		total += s.total - s.remaining
	}
	return total
}

func init() {
	// Suppress noisy logs in production
	if os.Getenv("RADAR_DEBUG") == "" {
		log.SetFlags(log.Ltime)
	}
}
