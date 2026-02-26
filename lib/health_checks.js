/**
 * Crawl/Index Health Checks Module
 * Analyzes crawl quality and index health
 */

const fs = require('fs');
const path = require('path');

function runHealthChecks(snapshotPath, outputPath) {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  
  const healthIssues = [];
  let healthScore = 100;
  
  // 1. Check HTTP status codes
  snapshot.pages.forEach(page => {
    if (page.status_code >= 400) {
      healthIssues.push({
        type: 'http_error',
        severity: 'critical',
        page: page.url,
        message: `Page returned HTTP ${page.status_code}`
      });
      healthScore -= 20;
    } else if (page.status_code >= 300 && page.status_code < 400) {
      healthIssues.push({
        type: 'redirect',
        severity: 'medium',
        page: page.url,
        message: `Page redirects (HTTP ${page.status_code})`
      });
      healthScore -= 10;
    }
  });
  
  // 2. Check for duplicate titles
  const titleMap = {};
  snapshot.pages.forEach(page => {
    if (page.title) {
      if (titleMap[page.title]) {
        healthIssues.push({
          type: 'duplicate_title',
          severity: 'medium',
          page: page.url,
          message: `Duplicate title: "${page.title}" also used by ${titleMap[page.title]}`
        });
        healthScore -= 5;
      } else {
        titleMap[page.title] = page.url;
      }
    }
  });
  
  // 3. Check for missing titles on key pages
  const keyPages = snapshot.pages.filter(p => p.url === snapshot.website_url || p.internal_links > 0);
  keyPages.forEach(page => {
    if (!page.title || page.title === '') {
      healthIssues.push({
        type: 'missing_title',
        severity: 'high',
        page: page.url,
        message: 'Key page missing title tag'
      });
      healthScore -= 10;
    }
  });
  
  // 4. Check for missing meta descriptions on key pages
  keyPages.forEach(page => {
    if (!page.meta_description || page.meta_description === '') {
      healthIssues.push({
        type: 'missing_meta_description',
        severity: 'high',
        page: page.url,
        message: 'Key page missing meta description'
      });
      healthScore -= 10;
    }
  });
  
  // 5. Check robots.txt and sitemap availability
  if (!snapshot.robots_txt || !snapshot.robots_txt.exists) {
    healthIssues.push({
      type: 'missing_robots_txt',
      severity: 'medium',
      page: snapshot.website_url,
      message: 'robots.txt not found - search engines may not discover all pages'
    });
    healthScore -= 10;
  }
  
  if (!snapshot.sitemaps || snapshot.sitemaps.length === 0) {
    healthIssues.push({
      type: 'missing_sitemap',
      severity: 'high',
      page: snapshot.website_url,
      message: 'No sitemap.xml found - may hinder deep crawling'
    });
    healthScore -= 15;
  }
  
  // 6. Check for thin content pages
  snapshot.pages.forEach(page => {
    if (page.word_count && page.word_count < 100 && page.status_code === 200) {
      healthIssues.push({
        type: 'thin_content',
        severity: 'low',
        page: page.url,
        message: `Very low word count (${page.word_count})`
      });
      healthScore -= 3;
    }
  });
  
  // 7. Check for non-HTML content crawled
  const nonHtmlPages = snapshot.pages.filter(p => 
    p.url.endsWith('.css') || p.url.endsWith('.js') || 
    p.url.endsWith('.ico') || p.url.endsWith('.png') ||
    p.url.endsWith('.jpg') || p.url.endsWith('.gif')
  );
  if (nonHtmlPages.length > 0) {
    healthIssues.push({
      type: 'non_html_crawled',
      severity: 'low',
      page: snapshot.website_url,
      message: `Crawled ${nonHtmlPages.length} non-HTML resources (css, images) - may want to exclude`
    });
    healthScore -= 2;
  }
  
  // 8. Check crawl coverage
  const htmlPages = snapshot.pages.filter(p => 
    !p.url.endsWith('.css') && !p.url.endsWith('.js') && 
    !p.url.endsWith('.ico') && !p.url.endsWith('.png')
  );
  
  healthScore = Math.max(0, healthScore);
  
  const result = {
    timestamp: new Date().toISOString(),
    health_score: healthScore,
    total_issues: healthIssues.length,
    critical_issues: healthIssues.filter(i => i.severity === 'critical').length,
    high_issues: healthIssues.filter(i => i.severity === 'high').length,
    medium_issues: healthIssues.filter(i => i.severity === 'medium').length,
    low_issues: healthIssues.filter(i => i.severity === 'low').length,
    issues: healthIssues,
    summary: {
      pages_crawled: snapshot.pages.length,
      html_pages: htmlPages.length,
      key_pages_identified: snapshot.key_pages ? snapshot.key_pages.length : 0,
      crawl_duration_ms: snapshot.crawl_duration_ms
    }
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log('Health checks complete:', result.health_score + '/100');
  console.log('Issues found:', result.total_issues);
  
  return result;
}

// CLI execution
if (require.main === module) {
  const snapshotPath = path.join(__dirname, '..', 'data', 'site_snapshot.json');
  const outputPath = path.join(__dirname, '..', 'data', 'health_checks.json');
  runHealthChecks(snapshotPath, outputPath);
}

module.exports = { runHealthChecks };
