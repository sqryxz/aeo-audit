# AEO Audit Report

**Website:** https://httpbin.org
**Brand:** HTTPBin
**Generated:** 2026-02-25T20:21:18.572Z

## Executive Summary

This AEO (AI Engine Optimization) audit analyzes the website for readiness to be cited by AI systems.

| Metric | Value |
|--------|-------|
| Total Issues | 17 |
| Critical | 0 |
| Warnings | 12 |
| Info | 5 |
| Overall Score | 35/100 |

## Target Queries

- http request testing
- api testing tool
- httpbin.org
- rest api testing

## Analysis Scores

| Analysis | Score |
|----------|-------|
| Content Coverage | undefined/100 |
| Crawl Health | undefined/100 |
| **Overall** | **35/100** |

## Issues by Category

### Content (4 issues)

#### ⚠️ CONTENT-001: Missing meta descriptions

**Severity:** warning

**Description:** Pages are missing meta description tags, which are important for search engine snippets and AI citation readiness.

**Recommendation:** Add unique meta description tags (150-160 characters) to all pages, including relevant keywords and a clear call-to-action.

**Affected Pages:**
- https://httpbin.org
- https://httpbin.org/forms/post

---

#### ⚠️ CONTENT-002: Missing H1 headings

**Severity:** warning

**Description:** Pages lack H1 headings, which help search engines understand the main topic of the page.

**Recommendation:** Add a single H1 heading to each page that clearly describes the page's main topic.

**Affected Pages:**
- https://httpbin.org
- https://httpbin.org/forms/post

---

#### ⚠️ CONTENT-003: Missing page title

**Severity:** warning

**Description:** One or more pages are missing required title tags, which are critical for SEO and user experience.

**Recommendation:** Add descriptive title tags (50-60 characters) to all pages.

**Affected Pages:**
- https://httpbin.org/forms/post

---

#### ⚠️ CONTENT-004: Thin content detected

**Severity:** warning

**Description:** Some pages have very low word counts, which may negatively impact search rankings and AI citation quality.

**Recommendation:** Expand content on thin pages to at least 300-500 words. Add valuable, substantive information that addresses user needs.

**Affected Pages:**
- https://httpbin.org/forms/post

---

### Technical (3 issues)

#### ⚠️ TECH-001: Missing robots.txt

**Severity:** warning

**Description:** No robots.txt file found. This file helps search engines understand which pages to crawl and which to exclude.

**Recommendation:** Create a robots.txt file at the domain root to guide search engine crawlers.

**Affected Pages:**
- https://httpbin.org

---

#### ⚠️ TECH-002: Missing sitemap.xml

**Severity:** warning

**Description:** No XML sitemap found. Sitemaps help search engines discover all pages on the site, especially important for larger sites.

**Recommendation:** Create and submit an XML sitemap to Google Search Console and Bing Webmaster Tools.

**Affected Pages:**
- https://httpbin.org

---

#### ℹ️ TECH-003: Non-HTML resources crawled

**Severity:** info

**Description:** The crawler encountered non-HTML resources (CSS, images) during the crawl.

**Recommendation:** Consider excluding non-HTML resources from future crawls using robots.txt or crawl configuration.

**Affected Pages:**
- https://httpbin.org

---

### Structured_data (5 issues)

#### ⚠️ SD-001: No Schema.org structured data

**Severity:** warning

**Description:** No Schema.org structured data (JSON-LD, Microdata, or RDFa) was found on the site. AI systems strongly prefer sites with structured data for citation.

**Recommendation:** Implement JSON-LD structured data using Schema.org vocabulary. Start with Organization, Article, or FAQ schemas as appropriate.

**Affected Pages:**
- https://httpbin.org

---

#### ⚠️ SD-002: Missing FAQ schema

**Severity:** warning

**Description:** No FAQ schema found. FAQ content with structured data is highly valued for AI citations and featured snippets.

**Recommendation:** Create FAQ pages with proper FAQPage schema markup to improve AI citation opportunities.

**Affected Pages:**
- https://httpbin.org

---

#### ⚠️ SD-003: Missing HowTo schema

**Severity:** warning

**Description:** No HowTo schema found. How-to content with structured data is frequently cited by AI systems.

**Recommendation:** Add HowTo schema to any how-to content on the site.

**Affected Pages:**
- https://httpbin.org

---

#### ℹ️ SD-004: Missing OpenGraph tags

**Severity:** info

**Description:** No OpenGraph meta tags found. OpenGraph helps control how URLs appear when shared on social media.

**Recommendation:** Add OpenGraph meta tags (og:title, og:description, og:image, og:url) for better social sharing.

**Affected Pages:**
- https://httpbin.org
- https://httpbin.org/forms/post

---

#### ℹ️ SD-005: Missing Twitter Card tags

**Severity:** info

**Description:** No Twitter Card meta tags found. Twitter Cards enhance how URLs appear in tweets.

**Recommendation:** Add Twitter Card meta tags (twitter:card, twitter:title, twitter:description, twitter:image).

**Affected Pages:**
- https://httpbin.org
- https://httpbin.org/forms/post

---

### Authority (4 issues)

#### ⚠️ AUTH-001: Missing author information

**Severity:** warning

**Description:** No author information or Author schema found. E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) requires clear attribution.

**Recommendation:** Add author bio pages and implement Author schema markup. Link author names to their profiles throughout the site.

**Affected Pages:**
- https://httpbin.org

---

#### ⚠️ AUTH-002: Missing Organization schema

**Severity:** warning

**Description:** No Organization schema found. Adding this helps establish brand authority and improves knowledge graph visibility.

**Recommendation:** Add Organization schema with company name, logo, contact info, and social profiles.

**Affected Pages:**
- https://httpbin.org

---

#### ℹ️ AUTH-003: Missing About page

**Severity:** info

**Description:** No About page detected. About pages are important for establishing trust and authority.

**Recommendation:** Create a comprehensive About page describing the organization, team, and mission.

**Affected Pages:**
- https://httpbin.org

---

#### ℹ️ AUTH-004: Missing Privacy Policy

**Severity:** info

**Description:** No Privacy Policy page detected. This is important for trust and may be required for compliance.

**Recommendation:** Add a Privacy Policy page, especially if collecting user data.

**Affected Pages:**
- https://httpbin.org

---

### Structure (1 issues)

#### ⚠️ STRUCT-001: Limited internal linking

**Severity:** warning

**Description:** The site has limited internal links between pages, which affects crawlability and page authority distribution.

**Recommendation:** Improve internal linking structure. Add navigation menus, related content links, and breadcrumb navigation.

**Affected Pages:**
- https://httpbin.org

---

## Priority Recommendations

### Quick Wins (Low Effort)

- **[CONTENT-001]** Missing meta descriptions
- **[CONTENT-002]** Missing H1 headings
- **[CONTENT-003]** Missing page title
- **[TECH-001]** Missing robots.txt

### Medium Effort

- **[TECH-002]** Missing sitemap.xml
- **[SD-001]** No Schema.org structured data
- **[SD-002]** Missing FAQ schema
- **[SD-003]** Missing HowTo schema
- **[AUTH-001]** Missing author information
- **[AUTH-002]** Missing Organization schema
- **[STRUCT-001]** Limited internal linking

### Major Projects (High Effort)

- **[CONTENT-004]** Thin content detected

---
*Report generated by AEO Agency Audit Pipeline*
