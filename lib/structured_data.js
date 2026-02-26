const fs = require('fs');
const path = require('path');

// Extract structured data from crawled pages
// Parses: JSON-LD, OpenGraph, Twitter Cards, Microdata

const TIMEOUT_MS = 10000;

async function fetchPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AEO-Agency-Bot/1.0 (Structured Data Extractor)'
      }
    });
    clearTimeout(timeout);
    return { html: await response.text(), status: response.status };
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

function extractStructuredData(html, url) {
  const results = [];
  
  // 1. Extract JSON-LD
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jsonLdMatch;
  while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(jsonLdMatch[1]);
      results.push({
        type: 'json-ld',
        schema: parsed['@type'] || 'Unknown',
        data: parsed
      });
    } catch (e) {
      // Invalid JSON, skip
    }
  }
  
  // 2. Extract OpenGraph tags
  const ogTags = {};
  const ogRegex = /<meta[^>]+property=["'](og:[^"']+)["'][^>]+content=["']([^"']*)["']/gi;
  let ogMatch;
  while ((ogMatch = ogRegex.exec(html)) !== null) {
    ogTags[ogMatch[1]] = ogMatch[2];
  }
  // Also check alternate format
  const ogAltRegex = /<meta[^>]+content=["']([^"']*)["'][^>]+property=["'](og:[^"']+)["']/gi;
  while ((ogMatch = ogAltRegex.exec(html)) !== null) {
    ogTags[ogMatch[2]] = ogMatch[1];
  }
  
  if (Object.keys(ogTags).length > 0) {
    results.push({
      type: 'opengraph',
      schema: ogTags['og:type'] || 'website',
      data: ogTags
    });
  }
  
  // 3. Extract Twitter Card tags
  const twitterTags = {};
  const twitterRegex = /<meta[^>]+name=["'](twitter:[^"']+)["'][^>]+content=["']([^"']*)["']/gi;
  let twitterMatch;
  while ((twitterMatch = twitterRegex.exec(html)) !== null) {
    twitterTags[twitterMatch[1]] = twitterMatch[2];
  }
  
  if (Object.keys(twitterTags).length > 0) {
    results.push({
      type: 'twitter-card',
      schema: twitterTags['twitter:card'] || 'summary',
      data: twitterTags
    });
  }
  
  // 4. Extract Microdata (Schema.org in HTML)
  const microdataItems = [];
  const itemScopeRegex = /<[^>]+itemscope[^>]*>/gi;
  const itemTypeRegex = /itemtype=["']([^"']+)["']/;
  const itemPropRegex = /itemprop=["']([^"']+)["'][^>]*content=["']([^"']*)["']/;
  
  // Simple microdata extraction - look for items with type
  const microdataRegex = /<([^>\s]+)[^>]*itemscope[^>]*itemtype=["']([^"']+)["'][^>]*>/gi;
  let mdMatch;
  while ((mdMatch = microdataRegex.exec(html)) !== null) {
    const schemaUrl = mdMatch[2];
    const schemaType = schemaUrl.split('/').pop().replace(']', '');
    microdataItems.push({
      type: 'microdata',
      schema: schemaType,
      data: { element: mdMatch[1], itemType: schemaUrl }
    });
  }
  
  results.push(...microdataItems);
  
  return results;
}

function extractKeyEntities(html) {
  const entities = new Set();
  
  // Extract organization names (common patterns)
  const orgPatterns = [
    /<meta[^>]+property=["'](?:og|article):publisher["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["'](?:author|creator)["'][^>]+content=["']([^"']+)["']/i,
  ];
  
  for (const pattern of orgPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      entities.add(match[1]);
    }
  }
  
  // Extract from JSON-LD
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jsonLdMatch;
  while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(jsonLdMatch[1]);
      // Common entity types
      if (parsed['@type']) {
        const type = parsed['@type'];
        if (Array.isArray(type)) {
          type.forEach(t => entities.add(t));
        } else {
          entities.add(type);
        }
      }
      if (parsed.publisher && parsed.publisher.name) {
        entities.add(parsed.publisher.name);
      }
      if (parsed.author) {
        const author = Array.isArray(parsed.author) ? parsed.author[0] : parsed.author;
        if (typeof author === 'string') {
          entities.add(author);
        } else if (author.name) {
          entities.add(author.name);
        }
      }
    } catch {}
  }
  
  return Array.from(entities);
}

async function main() {
  const dataDir = path.join(__dirname, '..', 'data');
  const snapshotPath = path.join(dataDir, 'site_snapshot.json');
  
  console.log('Loading site snapshot...');
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  
  console.log(`Processing ${snapshot.pages.length} pages for structured data...`);
  
  let totalStructuredData = 0;
  let allEntities = [];
  
  for (const page of snapshot.pages) {
    if (page.status_code !== 200) continue;
    
    console.log(`Extracting from: ${page.url}`);
    
    try {
      const { html } = await fetchPage(page.url);
      
      // Extract structured data
      const structuredData = extractStructuredData(html, page.url);
      page.structured_data = structuredData;
      totalStructuredData += structuredData.length;
      
      // Extract key entities
      const entities = extractKeyEntities(html);
      entities.forEach(e => {
        if (!allEntities.includes(e)) {
          allEntities.push(e);
        }
      });
      
    } catch (error) {
      console.error(`Error processing ${page.url}: ${error.message}`);
      page.structured_data = [];
    }
  }
  
  // Update snapshot
  snapshot.key_entities = allEntities;
  
  // Write updated snapshot
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
  
  console.log(`\nStructured data extraction complete!`);
  console.log(`- Total structured data entries: ${totalStructuredData}`);
  console.log(`- Key entities found: ${allEntities.length}`);
  console.log(`- Updated: ${snapshotPath}`);
}

main().catch(console.error);
