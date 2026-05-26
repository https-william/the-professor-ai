/**
 * ============================================================================
 * The Professor — Forum Scanner
 * ============================================================================
 *
 * Scans Reddit (public JSON API) and Nairaland (via Playwright) for
 * study-related discussions that match our keyword library. Outputs a
 * deduplicated, relevance-sorted leads file to growth/data/leads.json.
 *
 * Usage:
 *   node growth/scripts/forum-scanner.js              # full scan
 *   node growth/scripts/forum-scanner.js --reddit-only # Reddit only
 *   node growth/scripts/forum-scanner.js --nairaland-only
 *   node growth/scripts/forum-scanner.js --keyword "exam anxiety"
 *
 * Requirements:
 *   - Node.js 18+
 *   - Playwright (already in project deps)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { chromium } = require('playwright');

// ── Paths ────────────────────────────────────────────────────────────────────

const CONFIG_PATH = path.join(__dirname, 'config.json');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const GROWTH_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(GROWTH_DIR, 'data');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Timestamped console logger.
 */
function log(message, level = 'INFO') {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level}] ${message}`);
}

/**
 * Pause execution for `ms` milliseconds.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Load and parse config.json.
 */
function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Config file not found at ${CONFIG_PATH}`);
  }
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Parse CLI arguments into a simple flags object.
 *
 * Supported:
 *   --reddit-only        Scan Reddit only
 *   --nairaland-only     Scan Nairaland only
 *   --keyword "phrase"   Override keyword list with a single keyword
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {
    redditOnly: false,
    nairalandOnly: false,
    singleKeyword: null,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--reddit-only':
        flags.redditOnly = true;
        break;
      case '--nairaland-only':
        flags.nairalandOnly = true;
        break;
      case '--keyword':
        if (i + 1 < args.length) {
          flags.singleKeyword = args[++i];
        } else {
          log('--keyword flag requires a value', 'WARN');
        }
        break;
      default:
        log(`Unknown argument: ${args[i]}`, 'WARN');
    }
  }

  return flags;
}

/**
 * Make an HTTPS GET request and return parsed JSON.
 * Resolves with the JSON body or rejects on error/timeout.
 */
function fetchJSON(url, userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36') {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/json',
      },
      timeout: 30000,
    };

    const req = https.get(url, options, (res) => {
      // Handle redirects (Reddit sometimes 302s)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJSON(res.headers.location, userAgent).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        // Drain the response to free up memory
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }

      let body = '';
      res.setEncoding('utf-8');
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(new Error(`JSON parse error for ${url}: ${err.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timed out: ${url}`));
    });
  });
}

/**
 * Count how many keywords from the list appear in a given text (case-insensitive).
 */
function countKeywordMatches(text, keywords) {
  if (!text) return { count: 0, matched: [] };
  const lower = text.toLowerCase();
  const matched = keywords.filter((kw) => lower.includes(kw.toLowerCase()));
  return { count: matched.length, matched };
}

// ── Reddit Scanner ───────────────────────────────────────────────────────────

/**
 * Scan Reddit using its public JSON search API.
 *
 * For every (subreddit, keyword) pair we hit:
 *   https://www.reddit.com/r/{sub}/search.json?q={keyword}&sort=relevance&t=month&limit=10
 *
 * Returns an array of lead objects.
 */
async function scanReddit(config, keywords) {
  const { subreddits, api_base, results_per_sub, sort, time_filter } = config.reddit;
  const { delay_ms, max_requests_per_session } = config.rate_limit;

  const leads = [];
  let requestCount = 0;

  log(`Reddit scan starting — ${subreddits.length} subreddits × ${keywords.length} keywords`);

  for (const sub of subreddits) {
    for (const keyword of keywords) {
      // Respect session cap
      if (requestCount >= max_requests_per_session) {
        log(`Hit max requests per session (${max_requests_per_session}). Stopping Reddit scan.`, 'WARN');
        return leads;
      }

      const encodedKeyword = encodeURIComponent(keyword);
      const url =
        `${api_base}/r/${sub}/search.json` +
        `?q=${encodedKeyword}&sort=${sort}&t=${time_filter}&limit=${results_per_sub}&restrict_sr=on`;

      try {
        const data = await fetchJSON(url);

        if (!data || !data.data || !Array.isArray(data.data.children)) {
          log(`Unexpected response shape for r/${sub} + "${keyword}"`, 'WARN');
          continue;
        }

        for (const child of data.data.children) {
          const post = child.data;
          if (!post) continue;

          // Build a combined text blob for keyword matching
          const combinedText = `${post.title || ''} ${post.selftext || ''}`;
          const { count, matched } = countKeywordMatches(combinedText, keywords);

          leads.push({
            url: `https://www.reddit.com${post.permalink}`,
            title: post.title || '(no title)',
            subreddit: post.subreddit_name_prefixed || `r/${sub}`,
            snippet: (post.selftext || '').slice(0, 300),
            keywords_matched: matched,
            keyword_match_count: count,
            score: post.score || 0,
            num_comments: post.num_comments || 0,
            timestamp: post.created_utc
              ? new Date(post.created_utc * 1000).toISOString()
              : null,
            source: 'reddit',
            scraped_at: new Date().toISOString(),
          });
        }

        requestCount++;
        log(`  ✓ r/${sub} + "${keyword}" — ${data.data.children.length} results`);
      } catch (err) {
        log(`  ✗ r/${sub} + "${keyword}" — ${err.message}`, 'ERROR');
      }

      // Rate-limit pause
      await sleep(delay_ms);
    }
  }

  log(`Reddit scan complete — ${leads.length} raw leads from ${requestCount} requests`);
  return leads;
}

// ── Nairaland Scanner ────────────────────────────────────────────────────────

/**
 * Scan Nairaland's education section for matching threads using Playwright.
 *
 * Nairaland doesn't have a JSON API, so we use headless Chromium to:
 *   1. Navigate to the education section
 *   2. Search for each keyword
 *   3. Extract thread titles, URLs, and snippets from result pages
 *
 * Returns an array of lead objects.
 */
async function scanNairaland(config, keywords) {
  const nairalandConfig = config.forums.nairaland;

  if (!nairalandConfig || !nairalandConfig.enabled) {
    log('Nairaland scanning is disabled in config. Skipping.');
    return [];
  }

  const { base_url, sections } = nairalandConfig;
  const { delay_ms } = config.rate_limit;
  const leads = [];
  let browser;

  log(`Nairaland scan starting — ${keywords.length} keywords across ${sections.length} sections`);

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    // Unique sections only
    const uniqueSections = [...new Set(sections)];

    for (const section of uniqueSections) {
      for (const keyword of keywords) {
        try {
          // Nairaland search URL pattern
          const searchUrl = `${base_url}/search/${encodeURIComponent(keyword)}/${section}`;
          log(`  → Nairaland: searching "${keyword}" in /${section}`);

          await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

          // Extract thread links from search results.
          // Nairaland renders results as a list of <a> tags inside topic containers.
          const results = await page.evaluate((kw) => {
            const items = [];
            // Nairaland search results are typically in table rows or bold links
            const links = document.querySelectorAll('a[href*="/"]');

            for (const link of links) {
              const href = link.getAttribute('href') || '';
              const title = (link.textContent || '').trim();

              // Filter: only topic links (numeric thread IDs), skip navigation/footer
              if (
                title.length > 10 &&
                /\/\d+$/.test(href) &&
                !href.includes('/search') &&
                !href.includes('nairaland.com/register') &&
                !href.includes('nairaland.com/login')
              ) {
                // Get surrounding text as a snippet
                const parent = link.closest('td') || link.closest('div') || link.parentElement;
                const snippet = parent ? (parent.textContent || '').trim().slice(0, 300) : '';

                items.push({
                  url: href.startsWith('http') ? href : `https://www.nairaland.com${href}`,
                  title,
                  snippet,
                });
              }
            }

            // Deduplicate within this page
            const seen = new Set();
            return items.filter((item) => {
              if (seen.has(item.url)) return false;
              seen.add(item.url);
              return true;
            });
          }, keyword);

          for (const result of results) {
            const { count, matched } = countKeywordMatches(
              `${result.title} ${result.snippet}`,
              keywords
            );

            leads.push({
              url: result.url,
              title: result.title,
              forum: 'nairaland',
              section,
              snippet: result.snippet,
              keywords_matched: matched,
              keyword_match_count: count,
              timestamp: new Date().toISOString(), // Nairaland doesn't expose structured timestamps easily
              source: 'nairaland',
              scraped_at: new Date().toISOString(),
            });
          }

          log(`  ✓ Nairaland /${section} + "${keyword}" — ${results.length} threads`);
        } catch (err) {
          log(`  ✗ Nairaland /${section} + "${keyword}" — ${err.message}`, 'ERROR');
        }

        await sleep(delay_ms);
      }
    }

    await browser.close();
  } catch (err) {
    log(`Nairaland scanner fatal error: ${err.message}`, 'ERROR');
    if (browser) {
      try {
        await browser.close();
      } catch (_) {
        /* swallow close errors */
      }
    }
  }

  log(`Nairaland scan complete — ${leads.length} raw leads`);
  return leads;
}

// ── Post-Processing ──────────────────────────────────────────────────────────

/**
 * Deduplicate leads by URL. When duplicates exist, keep the one with the
 * highest keyword match count.
 */
function deduplicateLeads(leads) {
  const map = new Map();

  for (const lead of leads) {
    const normalized = lead.url.replace(/\/$/, '').toLowerCase();
    const existing = map.get(normalized);

    if (!existing || lead.keyword_match_count > existing.keyword_match_count) {
      map.set(normalized, lead);
    }
  }

  return Array.from(map.values());
}

/**
 * Sort leads by relevance:
 *   1. Primary: keyword match count (descending)
 *   2. Secondary: recency (most recent first)
 *   3. Tertiary: Reddit score (descending) — for Reddit leads only
 */
function sortLeads(leads) {
  return leads.sort((a, b) => {
    // Primary: keyword matches
    if (b.keyword_match_count !== a.keyword_match_count) {
      return b.keyword_match_count - a.keyword_match_count;
    }

    // Secondary: recency
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    if (timeB !== timeA) {
      return timeB - timeA;
    }

    // Tertiary: Reddit score
    return (b.score || 0) - (a.score || 0);
  });
}

/**
 * Truncate leads array to the configured maximum.
 */
function truncateLeads(leads, maxLeads) {
  if (leads.length > maxLeads) {
    log(`Truncating from ${leads.length} to ${maxLeads} leads`);
    return leads.slice(0, maxLeads);
  }
  return leads;
}

// ── Output ───────────────────────────────────────────────────────────────────

/**
 * Write the final leads array to disk and print a summary.
 */
function writeOutput(leads, config) {
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    log(`Created data directory: ${DATA_DIR}`);
  }

  const outputPath = path.join(DATA_DIR, 'leads.json');

  const output = {
    generated_at: new Date().toISOString(),
    total_leads: leads.length,
    leads,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  log(`Wrote ${leads.length} leads to ${outputPath}`);

  // ── Summary ──
  const bySource = {};
  for (const lead of leads) {
    bySource[lead.source] = (bySource[lead.source] || 0) + 1;
  }

  console.log('\n' + '═'.repeat(60));
  console.log('  📊  FORUM SCANNER — SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Total leads:  ${leads.length}`);
  console.log('  Breakdown by source:');
  for (const [source, count] of Object.entries(bySource)) {
    console.log(`    • ${source}: ${count}`);
  }

  if (leads.length > 0) {
    const topKeywords = {};
    for (const lead of leads) {
      for (const kw of lead.keywords_matched || []) {
        topKeywords[kw] = (topKeywords[kw] || 0) + 1;
      }
    }
    const sortedKw = Object.entries(topKeywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    console.log('  Top matched keywords:');
    for (const [kw, count] of sortedKw) {
      console.log(`    • "${kw}" — ${count} leads`);
    }
  }

  console.log('═'.repeat(60) + '\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '─'.repeat(60));
  console.log('  🎓  The Professor — Forum Scanner');
  console.log('─'.repeat(60) + '\n');

  // Load config
  const config = loadConfig();
  const flags = parseArgs();

  // Determine keyword list
  const keywords = flags.singleKeyword ? [flags.singleKeyword] : config.keywords;
  log(`Using ${keywords.length} keyword(s)`);

  // Collect leads from all sources
  let allLeads = [];

  // ── Reddit ──
  if (!flags.nairalandOnly) {
    try {
      const redditLeads = await scanReddit(config, keywords);
      allLeads = allLeads.concat(redditLeads);
    } catch (err) {
      log(`Reddit scanner failed entirely: ${err.message}`, 'ERROR');
      log('Continuing to other sources…', 'WARN');
    }
  } else {
    log('Skipping Reddit (--nairaland-only flag)');
  }

  // ── Nairaland ──
  if (!flags.redditOnly) {
    try {
      const nairalandLeads = await scanNairaland(config, keywords);
      allLeads = allLeads.concat(nairalandLeads);
    } catch (err) {
      log(`Nairaland scanner failed entirely: ${err.message}`, 'ERROR');
    }
  } else {
    log('Skipping Nairaland (--reddit-only flag)');
  }

  // ── Post-process ──
  log(`Raw leads collected: ${allLeads.length}`);

  let processed = deduplicateLeads(allLeads);
  log(`After deduplication: ${processed.length}`);

  processed = sortLeads(processed);
  processed = truncateLeads(processed, config.output.max_leads);

  // ── Write output ──
  writeOutput(processed, config);

  log('Scanner finished. ✅');
}

// ── Entry point ──────────────────────────────────────────────────────────────

main().catch((err) => {
  log(`Unhandled fatal error: ${err.message}`, 'FATAL');
  console.error(err);
  process.exit(1);
});
