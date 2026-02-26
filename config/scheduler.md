# AEO Monitoring Scheduler Configuration
# This file shows how to set up automated crawl-diff monitoring

## Option 1: Cron (macOS/Linux)

# Run monitoring check every day at 9 AM
# 0 9 * * * cd /path/to/aeo-workspace && node lib/run_monitoring.js --check >> logs/monitoring.log 2>&1

# Run full crawl + check every day at 9 AM
# 0 9 * * * cd /path/to/aeo-workspace && node lib/run_monitoring.js --crawl >> logs/monitoring.log 2>&1

# Run every 6 hours
# 0 */6 * * * cd /path/to/aeo-workspace && node lib/run_monitoring.js --check >> logs/monitoring.log 2>&1


## Option 2: LaunchD (macOS)

# Create ~/Library/LaunchAgents/com.aeo.monitoring.plist:
# <?xml version="1.0" encoding="UTF-8"?>
# <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
# <plist version="1.0">
# <dict>
#   <key>Label</key>
#   <string>com.aeo.monitoring</string>
#   <key>ProgramArguments</key>
#   <array>
#     <string>/usr/local/bin/node</string>
#     <string>/path/to/aeo-workspace/lib/run_monitoring.js</string>
#     <string>--crawl</string>
#   </array>
#   <key>StartCalendarInterval</key>
#   <dict>
#     <key>Hour</key>
#     <integer>9</integer>
#     <key>Minute</key>
#     <integer>0</integer>
#   </dict>
#   <key>WorkingDirectory</key>
#   <string>/path/to/aeo-workspace</string>
# </dict>
# </plist>


## Option 3: Node.js with node-cron

# npm install node-cron
# 
# const cron = require('node-cron');
# const monitoring = require('./lib/monitoring.js');
# 
# // Run every day at 9 AM
# cron.schedule('0 9 * * *', async () => {
#   console.log('Running scheduled monitoring...');
#   // Your monitoring logic here
# });


## Option 4: OpenClaw Cron (if available)

# Use OpenClaw cron to run the monitoring script periodically
# openclaw cron add "0 9 * * *" "node automata/aeo-workspace/lib/run_monitoring.js --crawl"


## Configuration

# Edit automata/aeo-workspace/config/monitoring.json to adjust:
# - check_interval_hours: How often to check (for scheduling)
# - alert_thresholds: Customize when alerts trigger
# - notifications: Set up notification channels

# Alert thresholds:
#   new_issues_critical: 0    # Alert on ANY new issue
#   score_drop_above: 10       # Alert if score drops > 10 points
#   pages_removed_above: 1   # Alert if any page is removed


## Quick Commands

# Check current status against baseline:
#   node lib/run_monitoring.js --check

# Full crawl + check:
#   node lib/run_monitoring.js --crawl

# Update baseline to current state:
#   node lib/run_monitoring.js --baseline
