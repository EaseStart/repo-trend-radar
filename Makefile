.PHONY: build scan explore track analyze detect export digest cards stats test clean dev

# Go binary
build:
	cd crawler && go build -o ../radar ./cmd/radar

# Full daily pipeline
scan: build
	./radar scan

# Individual phases
explore: build
	./radar explore

track: build
	./radar track

analyze: build
	./radar analyze

detect: build
	./radar detect

export: build
	./radar export

digest: build
	./radar digest

cards: build
	./radar cards

stats: build
	./radar stats

# Testing
test:
	cd crawler && go test ./...

# Dashboard
dev:
	cd dashboard && npm run dev

dashboard-build:
	cd dashboard && npm run build

# Clean
clean:
	rm -f radar
	rm -f data/radar.db
