/**
 * Citation Readiness Checks
 * 
 * Evaluates how well the site is optimized for AI citation/grounding.
 * This includes:
 * - Structured data presence (JSON-LD, Schema.org)
 * - E-E-A-T signals
 * - Clear factual content
 * - FAQ/how-to sections
 * - Author information
 */

const fs = require('fs');
const path = require('path');

function checkCitationReadiness(siteSnapshot) {
  const issues = [];
  let score = 0;
  const maxScore = 100;
  
  // Check 1: Structured Data (40 points max)
  let structuredDataScore = 0;
  let hasSchemaOrg = false;
  let hasAuthorSchema = false;
  let hasOrganizationSchema = false;
  let hasFAQSchema = false;
  let hasHowToSchema = false;
  
  for (const page of siteSnapshot.pages) {
    if (page.structured_data && page.structured_data.length > 0) {
      structuredDataScore += 10;
      for (const sd of page.structured_data) {
        if (sd['@type'] === 'SchemaOrg' || (sd['@context'] && sd['@context'].includes('schema.org'))) {
          hasSchemaOrg = true;
        }
        if (sd['@type'] === 'Person' || sd['@type'] === 'Author') {
          hasAuthorSchema = true;
        }
        if (sd['@type'] === 'Organization' || sd['@type'] === 'Corporation') {
          hasOrganizationSchema = true;
        }
        if (sd['@type'] === 'FAQPage' || (sd.mainEntity && Array.isArray(sd.mainEntity))) {
          hasFAQSchema = true;
        }
        if (sd['@type'] === 'HowTo') {
          hasHowToSchema = true;
        }
      }
    }
  }
  
  // Cap structured data score at 40
  structuredDataScore = Math.min(structuredDataScore, 40);
  score += structuredDataScore;
  
  // Check 2: E-E-A-T Signals (30 points max)
  let eatScore = 0;
  let hasAuthorInfo = false;
  let hasContactInfo = false;
  let hasAboutPage = false;
  let hasPrivacyPolicy = false;
  
  // Check for author-related keywords in content
  const allContent = siteSnapshot.pages.map(p => 
    (p.title || '') + ' ' + (p.meta_description || '') + ' ' + (p.h1?.join(' ') || '') + ' ' + (p.h2?.join(' ') || '')
  ).join(' ').toLowerCase();
  
  const authorKeywords = ['author', 'about', 'team', 'contact', 'privacy', 'terms'];
  for (const kw of authorKeywords) {
    if (allContent.includes(kw)) {
      eatScore += 5;
      if (kw === 'author' || kw === 'team') hasAuthorInfo = true;
      if (kw === 'contact') hasContactInfo = true;
      if (kw === 'about') hasAboutPage = true;
      if (kw === 'privacy') hasPrivacyPolicy = true;
    }
  }
  
  // Check for organization info in structured data
  if (hasOrganizationSchema) {
    eatScore += 5;
  }
  
  eatScore = Math.min(eatScore, 30);
  score += eatScore;
  
  // Check 3: Content Quality for AI (30 points max)
  let contentScore = 0;
  
  // Check for substantial content
  const pagesWithContent = siteSnapshot.pages.filter(p => (p.word_count || 0) > 100);
  contentScore += Math.min(pagesWithContent.length * 7, 20);
  
  // Check for clear headings structure (helps AI understand content)
  const pagesWithHeadings = siteSnapshot.pages.filter(p => (p.h1?.length > 0) || (p.h2?.length > 0));
  contentScore += Math.min(pagesWithHeadings.length * 5, 10);
  
  score += contentScore;
  
  // Generate issues based on findings
  if (!hasSchemaOrg) {
    issues.push({
      type: 'missing_schema_org',
      severity: 'high',
      page: siteSnapshot.website_url,
      message: 'No Schema.org structured data found. AI systems prefer sites with structured data for citation.'
    });
  }
  
  if (!hasAuthorSchema && !hasAuthorInfo) {
    issues.push({
      type: 'missing_author_info',
      severity: 'medium',
      page: siteSnapshot.website_url,
      message: 'No author information or Author schema found. E-E-A-T requires clear attribution.'
    });
  }
  
  if (!hasOrganizationSchema) {
    issues.push({
      type: 'missing_organization_schema',
      severity: 'medium',
      page: siteSnapshot.website_url,
      message: 'No Organization schema found. Adding this helps establish authority.'
    });
  }
  
  if (!hasFAQSchema) {
    issues.push({
      type: 'missing_faq_schema',
      severity: 'low',
      page: siteSnapshot.website_url,
      message: 'No FAQ schema found. FAQs are highly valued for AI citations.'
    });
  }
  
  if (!hasHowToSchema) {
    issues.push({
      type: 'missing_howto_schema',
      severity: 'low',
      page: siteSnapshot.website_url,
      message: 'No HowTo schema found. How-to content is frequently cited by AI.'
    });
  }
  
  const pagesWithThinContent = siteSnapshot.pages.filter(p => (p.word_count || 0) < 50);
  if (pagesWithThinContent.length > 0) {
    issues.push({
      type: 'thin_content',
      severity: 'high',
      page: siteSnapshot.website_url,
      message: `${pagesWithThinContent.length} page(s) with very thin content (<50 words). AI prefers substantial content.`
    });
  }
  
  return {
    citation_score: score,
    max_score: maxScore,
    total_issues: issues.length,
    high_severity: issues.filter(i => i.severity === 'high').length,
    medium_severity: issues.filter(i => i.severity === 'medium').length,
    low_severity: issues.filter(i => i.severity === 'low').length,
    checks: {
      structured_data: {
        score: structuredDataScore,
        max: 40,
        has_schema_org: hasSchemaOrg,
        has_author_schema: hasAuthorSchema,
        has_organization_schema: hasOrganizationSchema,
        has_faq_schema: hasFAQSchema,
        has_howto_schema: hasHowToSchema
      },
      eeat_signals: {
        score: eatScore,
        max: 30,
        has_author_info: hasAuthorInfo,
        has_contact_info: hasContactInfo,
        has_about_page: hasAboutPage,
        has_privacy_policy: hasPrivacyPolicy
      },
      content_quality: {
        score: contentScore,
        max: 30,
        pages_with_substantial_content: pagesWithContent.length,
        pages_with_headings: pagesWithHeadings.length
      }
    },
    issues: issues
  };
}

// Main execution
const workspaceDir = path.join(__dirname, '..');
const siteSnapshotPath = path.join(workspaceDir, 'data', 'site_snapshot.json');
const outputPath = path.join(workspaceDir, 'data', 'citation_readiness.json');

const siteSnapshot = JSON.parse(fs.readFileSync(siteSnapshotPath, 'utf-8'));
const results = checkCitationReadiness(siteSnapshot);

fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log('Citation readiness check complete. Results written to:', outputPath);
console.log('Score:', results.citation_score + '/' + results.max_score);
console.log('Issues found:', results.total_issues);
