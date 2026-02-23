// Brave Search API client for Kaeva Deepfake News Checker
const config = require('./config');

/**
 * Search Brave Web Search API for evidence related to a claim.
 * Fires 3 parallel queries: general, fact-check, and credible-sites.
 * Deduplicates results by URL and returns a flat array.
 *
 * @param {string} claim - The claim text to search for
 * @returns {Promise<Array<{title: string, url: string, snippet: string, source: string}>>}
 */
async function searchForEvidence(claim) {
  const apiKey = config.brave.apiKey;
  if (!apiKey) {
    console.warn('[braveSearch] No BRAVE_API_KEY configured -- returning empty results');
    return [];
  }

  const queries = [
    claim,
    `${claim} fact check`,
    `${claim} site:reuters.com OR site:apnews.com OR site:bbc.com`,
  ];

  try {
    const results = await Promise.all(queries.map(q => runBraveQuery(q, apiKey)));

    // Flatten all results
    const allResults = results.flat();

    // Deduplicate by URL
    const seen = new Set();
    const deduplicated = [];
    for (const result of allResults) {
      if (!seen.has(result.url)) {
        seen.add(result.url);
        deduplicated.push(result);
      }
    }

    console.log(`[braveSearch] ${deduplicated.length} unique results from ${allResults.length} total across ${queries.length} queries`);
    return deduplicated;
  } catch (err) {
    console.error('[braveSearch] Search failed:', err.message);
    return [];
  }
}

/**
 * Execute a single Brave Web Search query.
 *
 * @param {string} query - The search query
 * @param {string} apiKey - Brave API subscription token
 * @returns {Promise<Array<{title: string, url: string, snippet: string, source: string}>>}
 */
async function runBraveQuery(query, apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.brave.timeout);

  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[braveSearch] Query failed (${res.status}): "${query.slice(0, 60)}"`);
      return [];
    }

    const data = await res.json();
    const webResults = data.web?.results || [];

    return webResults.map(r => ({
      title: r.title || '',
      url: r.url || '',
      snippet: r.description || '',
      source: 'brave',
    }));
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      console.error(`[braveSearch] Query timed out: "${query.slice(0, 60)}"`);
    } else {
      console.error(`[braveSearch] Query error: ${err.message}`);
    }
    return [];
  }
}

module.exports = { searchForEvidence };
