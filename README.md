# AEO Audit Tool

AI Engine Optimization (AEO) audit tool for analyzing website visibility in AI-powered search results like ChatGPT Search, Perplexity, and Claude Search.

## Overview

This tool analyzes websites to assess their readiness for AI search engines. It evaluates multiple factors that influence how AI systems index, understand, and cite web content.

## Quick Start

```bash
# Install dependencies
npm install

# Generate full audit report
node lib/report_generator.js
```

This creates an `output/audit_report.md` with comprehensive findings.

## Prerequisites

- Node.js 18+
- npm

## Project Structure

```
aeo-workspace/
├── config/           # Configuration files
├── data/             # Input data and analysis results
├── lib/               # Core analysis scripts
├── schemas/           # JSON schemas for validation
├── utils/             # Utility functions
├── tests/             # Test files
├── input/             # Input files
├── output/            # Generated reports
└── package.json
```

## Configuration

Before running audits, configure your customer in `data/customer.json`:

```json
{
  "customer_id": "your-customer-id",
  "domain": "https://example.com",
  "brand_name": "Your Brand",
  "target_queries": [
    "primary keyword",
    "secondary keyword"
  ],
  "competitors": [
    "competitor1.com",
    "competitor2.com"
  ]
}
```

## Usage

### 1. Run Full Audit

Generate a complete markdown report:

```bash
node lib/report_generator.js
```

Output: `output/audit_report.md`

### 2. Individual Analysis Modules

Run specific analyses:

```bash
# Citation Readiness - How likely is AI to cite this content?
node lib/citation_readiness.js

# Content Coverage - Does content match target queries?
node lib/content_coverage.js

# Competitor Gap - How do you compare to competitors?
node lib/competitor_gap.js

# Health Checks - Technical SEO health
node lib/health_checks.js

# Key Pages - Are important pages indexed?
node lib/key_pages.js

# Structured Data - Schema markup analysis
node lib/structured_data.js
```

### 3. Crawl a Site

First, crawl a website to create a snapshot:

```bash
node lib/crawler.js https://example.com
```

This saves to `data/site_snapshot.json`.

### 4. Monitoring

Run ongoing monitoring:

```bash
# Run monitoring checks
node lib/monitoring.js

# Run continuous monitoring
node lib/run_monitoring.js
```

## Analysis Modules

| Module | Purpose |
|--------|---------|
| `citation_readiness.js` | Evaluates AI citation potential |
| `content_coverage.js` | Analyzes content vs target queries |
| `competitor_gap.js` | Compares against competitors |
| `health_checks.js` | Technical SEO health |
| `key_pages.js` | Important page analysis |
| `structured_data.js` | Schema markup validation |
| `crawler.js` | Website crawling |
| `monitoring.js` | Ongoing monitoring |
| `report_generator.js` | Creates markdown report |

## Example Workflow

### Step 1: Configure Customer

Edit `data/customer.json`:

```json
{
  "customer_id": "acme-corp",
  "domain": "https://acme.com",
  "brand_name": "Acme Corp",
  "target_queries": [
    "enterprise software",
    "B2B solutions",
    "acme corp reviews"
  ],
  "competitors": [
    "competitor1.com",
    "competitor2.com"
  ]
}
```

### Step 2: Crawl Site

```bash
node lib/crawler.js https://acme.com
```

### Step 3: Run Analyses

```bash
# Run all analyses
for script in citation_readiness content_coverage competitor_gap health_checks; do
  node lib/${script}.js
done
```

### Step 4: Generate Report

```bash
node lib/report_generator.js
```

### Step 5: View Results

Open `output/audit_report.md` for the full report.

## Output Files

After running analyses, these files are created in `data/`:

- `site_snapshot.json` - Crawled website data
- `citation_readiness.json` - AI citation analysis
- `content_coverage.json` - Content vs query matching
- `competitor_gap.json` - Competitive analysis
- `health_checks.json` - Technical health
- `issues.json` - All issues found

## Scoring

Each module provides scores:

- **Citation Readiness**: 0-100 (higher = more likely to be cited by AI)
- **Content Coverage**: Percentage of target queries covered
- **Health Checks**: Pass/fail with severity levels

## Tips for Improvement

1. **Add Structured Data** - JSON-LD schema helps AI understand content
2. **FAQ Pages** - AI systems love FAQ content for citations
3. **Author Authority** - Include author bios and credentials
4. **E-E-A-T Signals** - Experience, Expertise, Authoritativeness, Trustworthiness
5. **Clear Factual Content** - Direct answers to common questions

## Troubleshooting

**No output?**
- Check that `data/customer.json` exists and is valid JSON

**Crawler failing?**
- Ensure the domain is accessible
- Check `data/robots.txt` for crawl permissions

**Missing data files?**
- Run crawler first: `node lib/crawler.js <domain>`

## License

MIT
