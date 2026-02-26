const fs = require('fs');
const path = require('path');

/**
 * Generate audit_report.md from analysis data
 */
function generateAuditReport(workspaceDir = './') {
  // Load data files
  const customer = JSON.parse(fs.readFileSync(path.join(workspaceDir, 'data/customer.json'), 'utf8'));
  const issues = JSON.parse(fs.readFileSync(path.join(workspaceDir, 'data/issues.json'), 'utf8'));
  
  // Try to load site_snapshot for additional context
  let siteSnapshot = null;
  try {
    siteSnapshot = JSON.parse(fs.readFileSync(path.join(workspaceDir, 'data/site_snapshot.json'), 'utf8'));
  } catch (e) {
    // site_snapshot may not exist yet
  }
  
  // Try to load other analysis results
  let contentCoverage = null;
  let healthChecks = null;
  let citationReadiness = null;
  
  try {
    contentCoverage = JSON.parse(fs.readFileSync(path.join(workspaceDir, 'data/content_coverage.json'), 'utf8'));
    contentCoverage = contentCoverage.summary;
  } catch (e) {}
  
  try {
    healthChecks = JSON.parse(fs.readFileSync(path.join(workspaceDir, 'data/health_checks.json'), 'utf8'));
    healthChecks = healthChecks.summary;
  } catch (e) {}
  
  try {
    citationReadiness = JSON.parse(fs.readFileSync(path.join(workspaceDir, 'data/citation_readiness.json'), 'utf8'));
    citationReadiness = citationReadiness.summary;
  } catch (e) {}
  
  // Build the report
  const lines = [];
  
  // Header
  lines.push(`# AEO Audit Report`);
  lines.push('');
  lines.push(`**Website:** ${customer.domain}`);
  lines.push(`**Brand:** ${customer.brand_name || 'N/A'}`);
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push('');
  
  // Executive Summary
  lines.push(`## Executive Summary`);
  lines.push('');
  lines.push(`This AEO (AI Engine Optimization) audit analyzes the website for readiness to be cited by AI systems.`);
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Issues | ${issues.summary.total_issues} |`);
  lines.push(`| Critical | ${issues.summary.critical_count} |`);
  lines.push(`| Warnings | ${issues.summary.warning_count} |`);
  lines.push(`| Info | ${issues.summary.info_count} |`);
  lines.push(`| Overall Score | ${issues.summary.score}/100 |`);
  lines.push('');
  
  // Target Queries
  if (customer.target_queries && customer.target_queries.length > 0) {
    lines.push(`## Target Queries`);
    lines.push('');
    customer.target_queries.forEach(q => {
      lines.push(`- ${q}`);
    });
    lines.push('');
  }
  
  // Analysis Scores
  lines.push(`## Analysis Scores`);
  lines.push('');
  lines.push(`| Analysis | Score |`);
  lines.push(`|----------|-------|`);
  if (contentCoverage) lines.push(`| Content Coverage | ${contentCoverage.score}/100 |`);
  if (healthChecks) lines.push(`| Crawl Health | ${healthChecks.score}/100 |`);
  if (citationReadiness) lines.push(`| Citation Readiness | ${citationReadiness.score}/100 |`);
  lines.push(`| **Overall** | **${issues.summary.score}/100** |`);
  lines.push('');
  
  // Issues by Category
  const categories = {};
  issues.issues.forEach(issue => {
    if (!categories[issue.category]) categories[issue.category] = [];
    categories[issue.category].push(issue);
  });
  
  lines.push(`## Issues by Category`);
  lines.push('');
  
  for (const [category, categoryIssues] of Object.entries(categories)) {
    lines.push(`### ${capitalize(category)} (${categoryIssues.length} issues)`);
    lines.push('');
    
    // Sort by severity
    const severityOrder = { warning: 1, info: 2, critical: 0 };
    categoryIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    
    categoryIssues.forEach(issue => {
      const severityEmoji = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
      lines.push(`#### ${severityEmoji} ${issue.id}: ${issue.title}`);
      lines.push('');
      lines.push(`**Severity:** ${issue.severity}`);
      lines.push('');
      lines.push(`**Description:** ${issue.description}`);
      lines.push('');
      lines.push(`**Recommendation:** ${issue.recommendation}`);
      lines.push('');
      if (issue.affected_pages && issue.affected_pages.length > 0) {
        lines.push(`**Affected Pages:**`);
        issue.affected_pages.forEach(p => {
          lines.push(`- ${p}`);
        });
        lines.push('');
      }
      lines.push(`---`);
      lines.push('');
    });
  }
  
  // Priority Recommendations
  lines.push(`## Priority Recommendations`);
  lines.push('');
  
  const criticalAndWarnings = issues.issues.filter(i => i.severity === 'critical' || i.severity === 'warning');
  const byEffort = { low: [], medium: [], high: [] };
  criticalAndWarnings.forEach(i => {
    if (byEffort[i.effort_estimate]) {
      byEffort[i.effort_estimate].push(i);
    }
  });
  
  lines.push(`### Quick Wins (Low Effort)`);
  lines.push('');
  byEffort.low.forEach(i => {
    lines.push(`- **[${i.id}]** ${i.title}`);
  });
  lines.push('');
  
  lines.push(`### Medium Effort`);
  lines.push('');
  byEffort.medium.forEach(i => {
    lines.push(`- **[${i.id}]** ${i.title}`);
  });
  lines.push('');
  
  lines.push(`### Major Projects (High Effort)`);
  lines.push('');
  byEffort.high.forEach(i => {
    lines.push(`- **[${i.id}]** ${i.title}`);
  });
  lines.push('');
  
  // Footer
  lines.push(`---`);
  lines.push(`*Report generated by AEO Agency Audit Pipeline*`);
  
  return lines.join('\n');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// CLI execution
if (require.main === module) {
  const workspaceDir = process.argv[2] || './';
  const report = generateAuditReport(workspaceDir);
  console.log(report);
}

module.exports = { generateAuditReport };
