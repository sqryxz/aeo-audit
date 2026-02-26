# AEO Audit Tool

AI Engine Optimization (AEO) audit tool for analyzing website visibility in AI-powered search results.

## Overview

This tool analyzes websites to assess their readiness for AI search engines (ChatGPT Search, Perplexity, Claude Search, etc.). It evaluates multiple factors that influence how AI systems index, understand, and cite web content.

## Features

- **Citation Readiness** — Evaluates how likely content is to be cited by AI
- **Content Coverage** — Analyzes content depth and completeness
- **Competitor Gap Analysis** — Compares against competing sites
- **Health Checks** — Technical SEO health assessment
- **Key Pages Analysis** — Evaluates important landing pages
- **Structured Data** — Checks for schema markup and metadata
- **Monitoring** — Ongoing tracking and reporting

## Installation

```bash
npm install
```

## Usage

```bash
# Run full audit
node lib/report_generator.js

# Run specific analysis
node lib/citation_readiness.js
node lib/competitor_gap.js
node lib/content_coverage.js

# Health checks
node lib/health_checks.js

# Monitoring
node lib/monitoring.js
```

## Project Structure

```
aeo-workspace/
├── config/           # Configuration files
├── data/             # Audit data and snapshots
├── inputs/           # Input files for analysis
├── lib/              # Core analysis scripts
├── schemas/          # JSON schemas for validation
├── utils/            # Utility functions
├── tests/            # Test files
└── output/           # Generated reports
```

## Output

The tool generates JSON reports in the `output/` directory, including:
- Citation readiness scores
- Competitor gap analysis
- Content coverage metrics
- Health check results
- Site snapshots

## Tech Stack

- Node.js
- Ajv (JSON Schema validation)

## License

MIT
