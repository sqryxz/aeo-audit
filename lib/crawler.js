const fs = require('fs');
const path = require('path');

// Simple crawler for AEO Agency
// Crawls a website and builds a site_snapshot.json

const START_URL = process.argv[2] || (() => {
  const customer = JSON.parse(fs.readFileSync('./data/customer.json', 'utf8'));
  return customer.domain || customer.website_url;
})();
const MAX_PAGES = 10;
const TIMEOUT_MS = 10000;

const visited = new Set();
const pages = [];
const baseUrl = new URL(START_URL);

async function fetchPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AEO-Agency-Bot/1.0 (Automated Audit Crawler)'
      }
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

function extractLinks(html, base) {
  const links = [];
  const urlRegex = /href=["']([^"']+)["']/gi;
  let match;
  
  while ((match = urlRegex.exec(html)) !== null) {
    try {
      const href = match[1];
      // Skip anchors, javascript, mailto, tel
      if (href.startsWith('#') || href.startsWith('javascript:') || 
          href.startsWith('mailto:') || href.startsWith('tel:')) {
        continue;
      }
      
      let resolvedUrl;
      try {
        resolvedUrl = new URL(href, base);
      } catch {
        continue;
      }
      
      // Only follow internal links
      if (resolvedUrl.hostname === base.hostname) {
        links.push(resolvedUrl.href);
      }
    } catch {
      continue;
    }
  }
  
  return [...new Set(links)];
}

function extractMeta(html) {
  const result = {
    title: '',
    meta_description: '',
    h1: [],
    h2: [],
    h3: [],
    structured_data: [],
    word_count: 0,
    images: [],
    internal_links: 0,
    external_links: 0
  };
  
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) result.title = titleMatch[1].trim();
  
  // Extract meta description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  if (!descMatch) {
    const altDescMatch = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    if (altDescMatch) result.meta_description = altDescMatch[1].trim();
  } else {
    result.meta_description = descMatch[1].trim();
  }
  
  // Extract headings
  const h1Regex = /<h1[^>]*>([^<]+)<\/h1>/gi;
  let h1Match;
  while ((h1Match = h1Regex.exec(html)) !== null) {
    result.h1.push(h1Match[1].replace(/<[^>]+>/g, '').trim());
  }
  
  const h2Regex = /<h2[^>]*>([^<]+)<\/h2>/gi;
  let h2Match;
  while ((h2Match = h2Regex.exec(html)) !== null) {
    result.h2.push(h2Match[1].replace(/<[^>]+>/g, '').trim());
  }
  
  const h3Regex = /<h3[^>]*>([^<]+)<\/h3>/gi;
  let h3Match;
  while ((h3Match = h3Regex.exec(html)) !== null) {
    result.h3.push(h3Match[1].replace(/<[^>]+>/g, '').trim());
  }
  
  // Extract structured data (JSON-LD)
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jsonLdMatch;
  while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
    try {
      result.structured_data.push(JSON.parse(jsonLdMatch[1]));
    } catch {}
  }
  
  // Extract images with alt text
  const imgRegex = /<img[^>]+>/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    const img = { src: '', alt: '', has_alt: false };
    const srcMatch = imgMatch[0].match(/src=["']([^"']+)["']/);
    const altMatch = imgMatch[0].match(/alt=["']([^"']*)["']/);
    if (srcMatch) img.src = srcMatch[1];
    if (altMatch) {
      img.alt = altMatch[1];
      img.has_alt = altMatch[1].length > 0;
    }
    if (img.src) result.images.push(img);
  }
  
  // Simple word count (strip HTML)
  const textOnly = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  result.word_count = textOnly.split(/\s+/).filter(w => w.length > 0).length;
  
  return result;
}

async function crawl(url) {
  if (visited.has(url) || pages.length >= MAX_PAGES) return;
  
  console.log(`Crawling: ${url}`);
  visited.add(url);
  
  try {
    const response = await fetchPage(url);
    const html = await response.text();
    
    const pageData = {
      url: url,
      status_code: response.status,
      ...extractMeta(html)
    };
    
    // Count links
    const allLinks = extractLinks(html, new URL(url));
    pageData.internal_links = allLinks.filter(l => new URL(l).hostname === baseUrl.hostname).length;
    pageData.external_links = allLinks.length - pageData.internal_links;
    
    pages.push(pageData);
    
    // Follow internal links (up to MAX_PAGES)
    const internalLinks = allLinks.filter(l => new URL(l).hostname === baseUrl.hostname);
    for (const link of internalLinks.slice(0, MAX_PAGES - pages.length)) {
      if (!visited.has(link)) {
        await crawl(link);
      }
    }
    
  } catch (error) {
    console.error(`Error crawling ${url}: ${error.message}`);
    pages.push({
      url: url,
      status_code: 0,
      error: error.message
    });
  }
}

async function main() {
  console.log(`Starting crawl of ${START_URL}`);
  const startTime = Date.now();
  
  await crawl(START_URL);
  
  const crawlDuration = Date.now() - startTime;
  
  const snapshot = {
    website_url: START_URL,
    crawled_at: new Date().toISOString(),
    crawl_duration_ms: crawlDuration,
    pages_crawled: pages.length,
    pages: pages,
    robots_txt: { exists: false },
    sitemaps: [],
    key_entities: []
  };
  
  // Write to output
  const outputPath = path.join(__dirname, '..', 'data', 'site_snapshot.json');
  fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2));
  
  console.log(`\nCrawl complete!`);
  console.log(`- Pages crawled: ${pages.length}`);
  console.log(`- Duration: ${crawlDuration}ms`);
  console.log(`- Output: ${outputPath}`);
}

main().catch(console.error);
