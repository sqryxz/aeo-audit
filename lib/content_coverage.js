/**
 * Content Coverage Checker
 * Analyzes content quality and coverage across crawled pages
 */

const fs = require('fs');
const path = require('path');

function analyzeContentCoverage(siteSnapshot) {
  const issues = [];
  const pages = siteSnapshot.pages || [];
  
  // Filter to actual content pages (not assets)
  const contentPages = pages.filter(p => {
    const url = p.url.toLowerCase();
    return !url.endsWith('.css') && !url.endsWith('.js') && !url.endsWith('.ico') && !url.endsWith('.png') && !url.endsWith('.jpg');
  });

  // Check 1: Meta descriptions
  contentPages.forEach(page => {
    if (!page.meta_description || page.meta_description.trim() === '') {
      issues.push({
        type: 'missing_meta_description',
        severity: 'high',
        page: page.url,
        message: 'Page missing meta description'
      });
    } else if (page.meta_description.length < 50) {
      issues.push({
        type: 'short_meta_description',
        severity: 'medium',
        page: page.url,
        message: `Meta description too short (${page.meta_description.length} chars). Recommended: 150-160`
      });
    }
  });

  // Check 2: H1 tags
  contentPages.forEach(page => {
    if (!page.h1 || page.h1.length === 0) {
      issues.push({
        type: 'missing_h1',
        severity: 'high',
        page: page.url,
        message: 'Page missing H1 heading'
      });
    } else if (page.h1.length > 1) {
      issues.push({
        type: 'multiple_h1',
        severity: 'medium',
        page: page.url,
        message: `Multiple H1 headings found (${page.h1.length}). Should have exactly one.`
      });
    }
  });

  // Check 3: Title tags
  contentPages.forEach(page => {
    if (!page.title || page.title.trim() === '') {
      issues.push({
        type: 'missing_title',
        severity: 'high',
        page: page.url,
        message: 'Page missing title tag'
      });
    }
  });

  // Check 4: Content word count
  contentPages.forEach(page => {
    if (page.word_count < 50) {
      issues.push({
        type: 'thin_content',
        severity: 'medium',
        page: page.url,
        message: `Very low word count (${page.word_count}). Pages should have substantial content.`
      });
    }
  });

  // Check 5: Missing images alt text (if images exist)
  contentPages.forEach(page => {
    if (page.images && page.images.length > 0) {
      const imagesWithoutAlt = page.images.filter(img => !img.alt || img.alt.trim() === '');
      if (imagesWithoutAlt.length > 0) {
        issues.push({
          type: 'images_missing_alt',
          severity: 'medium',
          page: page.url,
          message: `${imagesWithoutAlt.length} images missing alt text`
        });
      }
    }
  });

  // Summary
  const summary = {
    total_content_pages: contentPages.length,
    pages_with_meta_description: contentPages.filter(p => p.meta_description && p.meta_description.trim()).length,
    pages_with_h1: contentPages.filter(p => p.h1 && p.h1.length > 0).length,
    pages_with_title: contentPages.filter(p => p.title && p.title.trim()).length,
    total_issues: issues.length,
    high_severity: issues.filter(i => i.severity === 'high').length,
    medium_severity: issues.filter(i => i.severity === 'medium').length,
    coverage_score: calculateCoverageScore(contentPages, issues)
  };

  return { issues, summary, contentPages };
}

function calculateCoverageScore(pages, issues) {
  if (pages.length === 0) return 0;
  
  let score = 100;
  
  // Deduct for high severity issues
  score -= issues.filter(i => i.severity === 'high').length * 15;
  
  // Deduct for medium severity issues
  score -= issues.filter(i => i.severity === 'medium').length * 5;
  
  return Math.max(0, Math.min(100, score));
}

module.exports = { analyzeContentCoverage };

// CLI execution
if (require.main === module) {
  const siteSnapshotPath = path.join(__dirname, '../data/site_snapshot.json');
  const siteSnapshot = JSON.parse(fs.readFileSync(siteSnapshotPath, 'utf8'));
  
  const result = analyzeContentCoverage(siteSnapshot);
  
  console.log('=== Content Coverage Analysis ===\n');
  console.log('Summary:');
  console.log(`  Total content pages: ${result.summary.total_content_pages}`);
  console.log(`  Pages with meta description: ${result.summary.pages_with_meta_description}`);
  console.log(`  Pages with H1: ${result.summary.pages_with_h1}`);
  console.log(`  Pages with title: ${result.summary.pages_with_title}`);
  console.log(`  Coverage score: ${result.summary.coverage_score}/100`);
  console.log(`  Total issues: ${result.summary.total_issues} (${result.summary.high_severity} high, ${result.summary.medium_severity} medium)\n`);
  
  if (result.issues.length > 0) {
    console.log('Issues Found:');
    result.issues.forEach(issue => {
      console.log(`  [${issue.severity.toUpperCase()}] ${issue.type}: ${issue.page}`);
      console.log(`    ${issue.message}`);
    });
  } else {
    console.log('No content coverage issues found.');
  }
  
  // Write issues to file
  const outputPath = path.join(__dirname, '../data/content_coverage.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\nResults written to: ${outputPath}`);
}
