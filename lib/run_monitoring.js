#!/usr/bin/env node
/**
 * AEO Monitoring CLI
 * Run crawl-diff monitoring checks
 * 
 * Usage:
 *   node run_monitoring.js           # Run full monitoring check
 *   node run_monitoring.js --check   # Run check only (no crawl)
 *   node run_monitoring.js --baseline # Create/update baseline
 *   node run_monitoring.js --help     # Show help
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const WORKSPACE_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(WORKSPACE_DIR, 'data');
const CONFIG_DIR = path.join(WORKSPACE_DIR, 'config');
const LIB_DIR = path.join(WORKSPACE_DIR, 'lib');

const args = process.argv.slice(2);
const command = args[0] || '--check';

async function crawlSite() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Crawling target site...');
    
    // Check if crawler exists
    const crawlerPath = path.join(LIB_DIR, 'crawler.js');
    if (!fs.existsSync(crawlerPath)) {
      reject(new Error('Crawler not found. Run audit first.'));
      return;
    }
    
    const crawler = spawn('node', [crawlerPath], {
      cwd: WORKSPACE_DIR,
      stdio: 'pipe'
    });
    
    let stdout = '';
    let stderr = '';
    
    crawler.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    crawler.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    crawler.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Crawl complete');
        resolve(stdout);
      } else {
        reject(new Error(`Crawl failed: ${stderr}`));
      }
    });
  });
}

async function loadCurrentSnapshot() {
  const snapshotPath = path.join(DATA_DIR, 'site_snapshot.json');
  if (!fs.existsSync(snapshotPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
}

async function createBaseline(snapshot) {
  const baselinePath = path.join(DATA_DIR, 'baseline_snapshot.json');
  
  const baseline = {
    ...snapshot,
    baseline_created_at: new Date().toISOString(),
    original_crawled_at: snapshot.crawled_at
  };
  
  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));
  
  // Update config
  const configPath = path.join(CONFIG_DIR, 'monitoring.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config.monitoring.baseline_snapshot = 'data/baseline_snapshot.json';
  config.monitoring.baseline_created_at = new Date().toISOString();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log('✅ Baseline snapshot created');
}

async function runMonitoringCheck(currentSnapshot) {
  const monitoring = require(path.join(LIB_DIR, 'monitoring.js'));
  
  const result = runMonitoringCheck(currentSnapshot);
  
  console.log('\n📊 Monitoring Results:');
  console.log(`   Status: ${result.status}`);
  
  if (result.diff) {
    console.log(`   Has changes: ${result.diff.summary.has_changes ? 'Yes' : 'No'}`);
    console.log(`   Changes: ${result.diff.changes.length}`);
  }
  
  if (result.alerts && result.alerts.length > 0) {
    console.log('\n🚨 Alerts:');
    for (const alert of result.alerts) {
      console.log(`   [${alert.level.toUpperCase()}] ${alert.message}`);
    }
  }
  
  return result;
}

async function main() {
  console.log('🎯 AEO Monitoring CLI\n');
  
  switch (command) {
    case '--help':
    case '-h':
      console.log(`
AEO Monitoring CLI

Commands:
  --check        Run monitoring check (compare with baseline)
  --crawl        Crawl site and run monitoring check
  --baseline     Create/update baseline from current snapshot
  --help         Show this help

Examples:
  node run_monitoring.js --check      # Quick check against baseline
  node run_monitoring.js --crawl       # Full: crawl + check
  node run_monitoring.js --baseline    # Set current as baseline
`);
      break;
      
    case '--baseline':
      console.log('📸 Creating baseline snapshot...');
      const snapshot = await loadCurrentSnapshot();
      if (!snapshot) {
        console.error('❌ No site_snapshot.json found. Run audit first.');
        process.exit(1);
      }
      await createBaseline(snapshot);
      console.log('✅ Baseline ready for monitoring');
      break;
      
    case '--crawl':
      try {
        await crawlSite();
        const currentSnapshot = await loadCurrentSnapshot();
        const monitoring = require(path.join(LIB_DIR, 'monitoring.js'));
        const result = monitoring.runMonitoringCheck(currentSnapshot);
        
        console.log('\n📊 Monitoring Results:');
        console.log(`   Status: ${result.status}`);
        
        if (result.diff) {
          console.log(`   Has changes: ${result.diff.summary.has_changes ? 'Yes' : 'No'}`);
          console.log(`   Changes: ${result.diff.changes.length}`);
        }
        
        if (result.alerts && result.alerts.length > 0) {
          console.log('\n🚨 Alerts:');
          for (const alert of result.alerts) {
            console.log(`   [${alert.level.toUpperCase()}] ${alert.message}`);
          }
        } else {
          console.log('\n✅ No alerts - site is stable');
        }
      } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      }
      break;
      
    case '--check':
    default:
      try {
        const currentSnapshot = await loadCurrentSnapshot();
        if (!currentSnapshot) {
          console.error('❌ No site_snapshot.json found. Run audit first.');
          process.exit(1);
        }
        
        const monitoring = require(path.join(LIB_DIR, 'monitoring.js'));
        const result = monitoring.runMonitoringCheck(currentSnapshot);
        
        console.log('\n📊 Monitoring Results:');
        console.log(`   Status: ${result.status}`);
        
        if (result.diff) {
          console.log(`   Has changes: ${result.diff.summary.has_changes ? 'Yes' : 'No'}`);
          console.log(`   Changes: ${result.diff.changes.length}`);
          
          if (result.diff.summary.has_changes) {
            console.log('\n   Change details:');
            for (const change of result.diff.changes) {
              console.log(`   - ${change.type}: ${change.baseline} → ${change.current} (${change.delta > 0 ? '+' : ''}${change.delta})`);
            }
          }
        }
        
        if (result.alerts && result.alerts.length > 0) {
          console.log('\n🚨 Alerts:');
          for (const alert of result.alerts) {
            console.log(`   [${alert.level.toUpperCase()}] ${alert.message}`);
          }
        } else if (result.status !== 'no_baseline') {
          console.log('\n✅ No alerts - site is stable');
        }
        
        if (result.status === 'no_baseline') {
          console.log('\n⚠️  No baseline. Run: node run_monitoring.js --baseline');
        }
      } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      }
      break;
  }
}

main().catch(console.error);
