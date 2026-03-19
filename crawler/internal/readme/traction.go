package readme

import (
	"regexp"
	"strings"
)

// TractionSignals holds the results of README traction analysis.
type TractionSignals struct {
	HasStarChart     bool
	HasUsedBy        bool
	HasDownloadCount bool
	HasGrowthChart   bool
	HasCompanyLogos  bool
	Badges           []string
}

var (
	// Star history chart patterns
	starChartPatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?i)star-history\.(com|t9t\.io)`),
		regexp.MustCompile(`(?i)api\.star-history`),
		regexp.MustCompile(`(?i)starchart\.cc`),
		regexp.MustCompile(`(?i)star.+history.+chart`),
	}

	// "Used by" section patterns
	usedByPatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?i)(used|trusted|loved|chosen)\s+(by|in)\s+(\d+[\+]?\s*)?(companies|organizations|teams|projects|developers)`),
		regexp.MustCompile(`(?i)##?\s*(who\s+(uses|is using)|used\s+by|trusted\s+by|companies|adopters|customers)`),
		regexp.MustCompile(`(?i)(powering|serving|supporting)\s+\d+`),
	}

	// Download count patterns
	downloadPatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?i)\d+[KkMmBb]?\+?\s*(downloads?|installs?|users?)`),
		regexp.MustCompile(`(?i)(downloads?|installs?)\s*:\s*\d+[KkMmBb]?\+?`),
		regexp.MustCompile(`(?i)npm\s+(downloads?|weekly)`),
		regexp.MustCompile(`(?i)pypi\s+(downloads?|monthly)`),
	}

	// Growth chart patterns
	growthPatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?i)(growth|adoption|usage)\s+(chart|graph|metrics)`),
		regexp.MustCompile(`(?i)<img[^>]+(growth|adoption|users|stats)[^>]+>`),
		regexp.MustCompile(`(?i)!\[.*?(growth|trending|analytics).*?\]`),
	}

	// Company logos patterns
	companyLogoPatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?i)(used|trusted|powered|built)\s+by.*?<img`),
		regexp.MustCompile(`(?i)##?\s*(sponsors?|backers?|supporters?)`),
		regexp.MustCompile(`(?i)<img[^>]+alt="[^"]*?(logo|company|enterprise)[^"]*?"[^>]*>`),
	}

	// Badge patterns (shields.io etc.)
	badgePatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?i)img\.shields\.io/npm/d[wmyt]?/`),
		regexp.MustCompile(`(?i)img\.shields\.io/pypi/d[wmyt]?/`),
		regexp.MustCompile(`(?i)img\.shields\.io/github/stars/`),
		regexp.MustCompile(`(?i)img\.shields\.io/crates/d/`),
		regexp.MustCompile(`(?i)img\.shields\.io/badge/`),
		regexp.MustCompile(`(?i)badgen\.net/`),
		regexp.MustCompile(`(?i)img\.shields\.io/docker/pulls/`),
	}
)

// MineTraction parses README markdown and extracts traction signals.
func MineTraction(content string) TractionSignals {
	if content == "" {
		return TractionSignals{}
	}

	// Truncate very long READMEs
	if len(content) > 50000 {
		content = content[:50000]
	}

	signals := TractionSignals{}

	// Star chart detection
	for _, p := range starChartPatterns {
		if p.MatchString(content) {
			signals.HasStarChart = true
			break
		}
	}

	// Used by detection
	for _, p := range usedByPatterns {
		if p.MatchString(content) {
			signals.HasUsedBy = true
			break
		}
	}

	// Download count detection
	for _, p := range downloadPatterns {
		if p.MatchString(content) {
			signals.HasDownloadCount = true
			break
		}
	}

	// Growth chart detection
	for _, p := range growthPatterns {
		if p.MatchString(content) {
			signals.HasGrowthChart = true
			break
		}
	}

	// Company logos detection
	for _, p := range companyLogoPatterns {
		if p.MatchString(content) {
			signals.HasCompanyLogos = true
			break
		}
	}

	// Badge detection
	badges := make([]string, 0)
	for _, p := range badgePatterns {
		matches := p.FindAllString(content, -1)
		for _, m := range matches {
			badge := classifyBadge(m)
			if badge != "" && !contains(badges, badge) {
				badges = append(badges, badge)
			}
		}
	}
	signals.Badges = badges

	return signals
}

// classifyBadge returns a readable badge type.
func classifyBadge(url string) string {
	lower := strings.ToLower(url)
	switch {
	case strings.Contains(lower, "npm/d"):
		return "npm_downloads"
	case strings.Contains(lower, "pypi/d"):
		return "pypi_downloads"
	case strings.Contains(lower, "crates/d"):
		return "crates_downloads"
	case strings.Contains(lower, "docker/pulls"):
		return "docker_pulls"
	case strings.Contains(lower, "github/stars"):
		return "github_stars"
	default:
		return "badge"
	}
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
