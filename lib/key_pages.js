/**
 * Key Pages & Entities Detection Module
 * Analyzes crawled site data to identify important pages and extract entities
 */

const fs = require('fs');
const path = require('path');

/**
 * Detect key pages from crawled pages
 * Criteria: word count, internal links, H1/H2 presence, status 200
 */
function detectKeyPages(pages) {
  const contentPages = pages.filter(p => {
    // Filter out non-content pages (CSS, images, etc.)
    const url = p.url.toLowerCase();
    return !url.endsWith('.css') && 
           !url.endsWith('.js') && 
           !url.endsWith('.ico') &&
           !url.endsWith('.png') &&
           !url.endsWith('.jpg') &&
           !url.endsWith('.gif') &&
           !url.includes('/static/') &&
           p.status_code === 200;
  });

  // Score pages based on content richness
  const scored = contentPages.map(page => {
    let score = 0;
    
    // Word count contribution (up to 40 points)
    score += Math.min(page.word_count / 10, 40);
    
    // Internal links contribution (up to 30 points)
    score += page.internal_links * 10;
    
    // H1 presence (20 points)
    if (page.h1 && page.h1.length > 0) score += 20;
    
    // H2 presence (10 points)
    if (page.h2 && page.h2.length > 0) score += 10;
    
    // Homepage bonus (prefer root)
    if (page.url === page.url.replace(/\/$/, '') || page.url.endsWith('/')) {
      score += 15;
    }
    
    return { ...page, _contentScore: score };
  });
  
  // Sort by score descending
  scored.sort((a, b) => b._contentScore - a._contentScore);
  
  // Take top pages (max 10)
  return scored.slice(0, 10).map(({ _contentScore, ...page }) => ({
    url: page.url,
    title: page.title || '',
    type: page.url === page.url.replace(/\/$/, '') || page.url.endsWith('/') ? 'homepage' : 
          page.url.includes('/blog') ? 'blog' :
          page.url.includes('/about') ? 'about' :
          page.url.includes('/contact') ? 'contact' :
          page.url.includes('/product') || page.url.includes('/service') ? 'product' : 'content',
    word_count: page.word_count,
    internal_links: page.internal_links,
    key_headings: [...(page.h1 || []), ...(page.h2 || [])].slice(0, 5),
    importance_score: Math.round(_contentScore)
  }));
}

/**
 * Extract entities from page content
 * Looks at: title, meta description, headings, URL path segments
 */
function extractEntities(pages) {
  const entities = [];
  const seen = new Set();
  
  pages.forEach(page => {
    const url = new URL(page.url);
    const pathSegments = url.pathname.split('/').filter(s => s && s !== 'index.html');
    
    // Extract from URL paths
    pathSegments.forEach(segment => {
      const normalized = segment.toLowerCase().replace(/[-_]/g, ' ');
      if (normalized.length > 2 && !seen.has(normalized)) {
        seen.add(normalized);
        entities.push({
          type: 'url_path',
          value: segment,
          display: normalized,
          source: page.url
        });
      }
    });
    
    // Extract from title
    if (page.title && page.title.length > 0) {
      const titleWords = page.title.toLowerCase().split(/\s+/);
      titleWords.forEach(word => {
        if (word.length > 3 && !seen.has(word)) {
          seen.add(word);
          entities.push({
            type: 'title',
            value: word,
            display: word,
            source: page.url
          });
        }
      });
    }
    
    // Extract from H1
    if (page.h1) {
      page.h1.forEach(h1 => {
        const words = h1.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 3 && !seen.has(word)) {
            seen.add(word);
            entities.push({
              type: 'heading',
              value: word,
              display: word,
              source: page.url
            });
          }
        });
      });
    }
    
    // Extract from H2
    if (page.h2) {
      page.h2.forEach(h2 => {
        const words = h2.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 3 && !seen.has(word)) {
            seen.add(word);
            entities.push({
              type: 'heading',
              value: word,
              display: word,
              source: page.url
            });
          }
        });
      });
    }
  });
  
  return entities;
}

/**
 * Main execution
 */
function main() {
  const dataDir = path.join(__dirname, '..', 'data');
  const snapshotPath = path.join(dataDir, 'site_snapshot.json');
  
  // Load site snapshot
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  
  // Detect key pages
  const keyPages = detectKeyPages(snapshot.pages);
  
  // Extract entities
  const keyEntities = extractEntities(snapshot.pages);
  
  // Update snapshot
  snapshot.key_pages = keyPages;
  snapshot.key_entities = keyEntities;
  
  // Write updated snapshot
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
  
  console.log('Key pages detected:', keyPages.length);
  console.log('Entities extracted:', keyEntities.length);
  console.log('\nKey Pages:');
  keyPages.forEach((p, i) => console.log(`  ${i+1}. ${p.url} (score: ${p.importance_score})`));
  console.log('\nTop Entities:', keyEntities.slice(0, 10).map(e => e.display).join(', '));
}

main();
