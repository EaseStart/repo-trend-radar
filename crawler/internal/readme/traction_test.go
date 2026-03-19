package readme

import "testing"

func TestMineTraction_StarChart(t *testing.T) {
	tests := []struct {
		name    string
		content string
		want    bool
	}{
		{
			name:    "star-history.com embed",
			content: `[![Star History Chart](https://api.star-history.com/svg?repos=qdrant/qdrant&type=Date)](https://star-history.com)`,
			want:    true,
		},
		{
			name:    "star-history.t9t.io embed",
			content: `![Star History](https://star-history.t9t.io/#qdrant/qdrant)`,
			want:    true,
		},
		{
			name:    "no star chart",
			content: `# My Project\n\nThis is a cool project.`,
			want:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			signals := MineTraction(tt.content)
			if signals.HasStarChart != tt.want {
				t.Errorf("HasStarChart = %v, want %v", signals.HasStarChart, tt.want)
			}
		})
	}
}

func TestMineTraction_UsedBy(t *testing.T) {
	tests := []struct {
		name    string
		content string
		want    bool
	}{
		{
			name:    "used by companies",
			content: `## Used by\n\nUsed by 50+ companies worldwide including Google and Meta.`,
			want:    true,
		},
		{
			name:    "trusted by organizations",
			content: `Trusted by 200+ organizations`,
			want:    true,
		},
		{
			name:    "no used by",
			content: `# Usage\n\nnpm install my-package`,
			want:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			signals := MineTraction(tt.content)
			if signals.HasUsedBy != tt.want {
				t.Errorf("HasUsedBy = %v, want %v", signals.HasUsedBy, tt.want)
			}
		})
	}
}

func TestMineTraction_DownloadCount(t *testing.T) {
	tests := []struct {
		name    string
		content string
		want    bool
	}{
		{
			name:    "npm downloads with K suffix",
			content: `This package has 500K downloads per month.`,
			want:    true,
		},
		{
			name:    "million installs",
			content: `Over 2M installs worldwide.`,
			want:    true,
		},
		{
			name:    "no downloads mentioned",
			content: `# Getting Started\n\nInstall via pip:\n\npip install mypackage`,
			want:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			signals := MineTraction(tt.content)
			if signals.HasDownloadCount != tt.want {
				t.Errorf("HasDownloadCount = %v, want %v", signals.HasDownloadCount, tt.want)
			}
		})
	}
}

func TestMineTraction_Badges(t *testing.T) {
	content := `[![npm downloads](https://img.shields.io/npm/dm/mypackage)](https://npmjs.com)
[![Docker Pulls](https://img.shields.io/docker/pulls/myimage)](https://hub.docker.com)`

	signals := MineTraction(content)

	if len(signals.Badges) == 0 {
		t.Fatal("Expected badges, got none")
	}

	found := map[string]bool{}
	for _, b := range signals.Badges {
		found[b] = true
	}

	if !found["npm_downloads"] {
		t.Error("Expected npm_downloads badge")
	}
	if !found["docker_pulls"] {
		t.Error("Expected docker_pulls badge")
	}
}

func TestMineTraction_EmptyContent(t *testing.T) {
	signals := MineTraction("")
	if signals.HasStarChart || signals.HasUsedBy || signals.HasDownloadCount || signals.HasGrowthChart || signals.HasCompanyLogos {
		t.Error("Expected all signals to be false for empty content")
	}
	if len(signals.Badges) != 0 {
		t.Errorf("Expected 0 badges, got %d", len(signals.Badges))
	}
}

func TestMineTraction_LongContentTruncation(t *testing.T) {
	// Test that very long content doesn't crash
	content := string(make([]byte, 100000))
	signals := MineTraction(content) // Should not panic
	_ = signals
}

func TestMineTraction_MultipleSignals(t *testing.T) {
	content := `# My Project

[![Star History](https://api.star-history.com/svg?repos=me/repo)](https://star-history.com)

## Trusted by

Trusted by 100+ companies worldwide.

Over 1M downloads.

[![npm](https://img.shields.io/npm/dm/mypackage)](https://npmjs.com)`

	signals := MineTraction(content)

	if !signals.HasStarChart {
		t.Error("Expected HasStarChart = true")
	}
	if !signals.HasUsedBy {
		t.Error("Expected HasUsedBy = true")
	}
	if !signals.HasDownloadCount {
		t.Error("Expected HasDownloadCount = true")
	}
}
