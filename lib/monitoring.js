/**
 * Monitoring utilities for AEO Agency
 * Handles baseline comparison and change detection
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(WORKSPACE_DIR, 'data');
const CONFIG_DIR = path.join(WORKSPACE_DIR, 'config');

/**
 * Load monitoring configuration
 */
function loadMonitoringConfig() {
  const configPath = path.join(CONFIG_DIR, 'monitoring.json');
  if (!fs.existsSync(configPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

/**
 * Load baseline snapshot
 */
function loadBaseline() {
  const config = loadMonitoringConfig();
  if (!config || !config.monitoring.baseline_snapshot) {
    return null;
  }
  // Resolve relative to workspace directory
  const baselinePath = path.isAbsolute(config.monitoring.baseline_snapshot) 
    ? config.monitoring.baseline_snapshot
    : path.join(WORKSPACE_DIR, config.monitoring.baseline_snapshot);
  if (!fs.existsSync(baselinePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
}

/**
 * Compare current snapshot with baseline
 * @param {Object} currentSnapshot - Current site snapshot
 * @param {Object} baseline - Baseline snapshot
 * @returns {Object} Diff results
 */
function compareWithBaseline(currentSnapshot, baseline) {
  const diff = {
    timestamp: new Date().toISOString(),
    changes: [],
    summary: {
      has_changes: false,
      pages_added: 0,
      pages_removed: 0,
      scores: {}
    }
  };

  // Compare page counts
  const currentPageCount = currentSnapshot.pages_crawled || 0;
  const baselinePageCount = baseline.pages_crawled || 0;
  
  if (currentPageCount !== baselinePageCount) {
    diff.changes.push({
      type: 'page_count',
      baseline: baselinePageCount,
      current: currentPageCount,
      delta: currentPageCount - baselinePageCount
    });
    diff.summary.has_changes = true;
    diff.summary.pages_added = Math.max(0, currentPageCount - baselinePageCount);
    diff.summary.pages_removed = Math.max(0, baselinePageCount - currentPageCount);
  }

  // Compare scores
  const metrics = ['health_score', 'citation_score', 'content_coverage_score'];
  
  for (const metric of metrics) {
    const currentScore = currentSnapshot.health_checks?.health_score || 
                        currentSnapshot.citation_readiness?.citation_score ||
                        currentSnapshot.content_coverage?.coverage_score || 0;
    const baselineScore = baseline.health_checks?.health_score ||
                         baseline.citation_readiness?.citation_score ||
                         baseline.content_coverage?.coverage_score || 0;
    
    if (currentScore !== baselineScore) {
      diff.changes.push({
        type: metric,
        baseline: baselineScore,
        current: currentScore,
        delta: currentScore - baselineScore
      });
      diff.summary.has_changes = true;
      diff.summary.scores[metric] = {
        baseline: baselineScore,
        current: currentScore,
        delta: currentScore - baselineScore
      };
    }
  }

  // Compare issue counts
  const currentIssues = currentSnapshot.compilation_summary?.total_issues_found || 0;
  const baselineIssues = baseline.compilation_summary?.total_issues_found || 0;
  
  if (currentIssues !== baselineIssues) {
    diff.changes.push({
      type: 'issues_count',
      baseline: baselineIssues,
      current: currentIssues,
      delta: currentIssues - baselineIssues
    });
    diff.summary.has_changes = true;
  }

  // Compare structured data presence
  const currentStructuredData = currentSnapshot.pages?.reduce((sum, p) => 
    sum + (p.structured_data?.length || 0), 0) || 0;
  const baselineStructuredData = baseline.pages?.reduce((sum, p) => 
    sum + (p.structured_data?.length || 0), 0) || 0;
  
  if (currentStructuredData !== baselineStructuredData) {
    diff.changes.push({
      type: 'structured_data_count',
      baseline: baselineStructuredData,
      current: currentStructuredData,
      delta: currentStructuredData - baselineStructuredData
    });
    diff.summary.has_changes = true;
  }

  return diff;
}

/**
 * Check if changes exceed thresholds
 * @param {Object} diff - Diff results
 * @param {Object} thresholds - Alert thresholds from config
 * @returns {Object} Alert results
 */
function checkThresholds(diff, thresholds) {
  const alerts = [];
  
  for (const change of diff.changes) {
    if (change.type === 'issues_count' && change.delta > thresholds.new_issues_critical) {
      alerts.push({
        level: 'critical',
        message: `${change.delta} new issues detected`
      });
    }
    
    if (change.type.includes('score') && change.delta < -thresholds.score_drop_above) {
      alerts.push({
        level: 'warning',
        message: `${change.type} dropped by ${Math.abs(change.delta)} points`
      });
    }
    
    if (change.type === 'page_count' && change.delta < -thresholds.pages_removed_above) {
      alerts.push({
        level: 'warning',
        message: `${Math.abs(change.delta)} pages removed`
      });
    }
  }
  
  return alerts;
}

/**
 * Run full monitoring check
 * @param {Object} currentSnapshot - Current site snapshot
 * @returns {Object} Monitoring results
 */
function runMonitoringCheck(currentSnapshot) {
  const config = loadMonitoringConfig();
  
  if (!config || !config.monitoring.enabled) {
    return { status: 'disabled' };
  }
  
  const baseline = loadBaseline();
  
  if (!baseline) {
    return { 
      status: 'no_baseline',
      message: 'No baseline snapshot found. Run audit first.' 
    };
  }
  
  const diff = compareWithBaseline(currentSnapshot, baseline);
  const alerts = checkThresholds(diff, config.monitoring.alert_thresholds);
  
  // Update history
  config.history = config.history || [];
  config.history.push({
    checked_at: diff.timestamp,
    diff: diff,
    alerts: alerts
  });
  
  // Keep only last 30 entries
  if (config.history.length > 30) {
    config.history = config.history.slice(-30);
  }
  
  fs.writeFileSync(
    path.join(CONFIG_DIR, 'monitoring.json'),
    JSON.stringify(config, null, 2)
  );
  
  return {
    status: alerts.length > 0 ? 'alerts' : 'ok',
    diff: diff,
    alerts: alerts,
    baseline_date: baseline.baseline_created_at || baseline.crawled_at
  };
}

module.exports = {
  loadMonitoringConfig,
  loadBaseline,
  compareWithBaseline,
  checkThresholds,
  runMonitoringCheck
};
