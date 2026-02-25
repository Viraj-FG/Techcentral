// Source credibility tiers — used for prioritizing evidence
// Tier 1: Dedicated fact-checkers and primary sources (highest trust)
// Tier 2: Major wire services and quality journalism
// Tier 3: Established mainstream outlets
// Tier 4: Known but lower editorial standards

const SOURCE_TIERS = {
  // Tier 1 — Fact-check organizations & primary sources
  tier1: {
    label: 'Fact-Check / Primary Source',
    trust: 'highest',
    weight: 1.0,
    color: '#22c55e',
    domains: [
      'snopes.com',
      'politifact.com',
      'factcheck.org',
      'fullfact.org',
      'africacheck.org',
      'checkyourfact.com',
      'leadstories.com',
      'truthorfiction.com',
      'misbar.com',
      // Government / official
      'who.int',
      'cdc.gov',
      'nih.gov',
      'nasa.gov',
      'fda.gov',
      'epa.gov',
      'state.gov',
      'un.org',
      'europa.eu',
      'gov.uk',
      // Academic / scientific
      'nature.com',
      'science.org',
      'thelancet.com',
      'nejm.org',
      'bmj.com',
      'pubmed.ncbi.nlm.nih.gov',
      'scholar.google.com',
      'arxiv.org',
      'pnas.org',
      'cell.com',
    ]
  },

  // Tier 2 — Wire services & premium journalism
  tier2: {
    label: 'Wire Service / Premium',
    trust: 'very high',
    weight: 0.85,
    color: '#3b82f6',
    domains: [
      'apnews.com',
      'reuters.com',
      'bbc.com',
      'bbc.co.uk',
      'npr.org',
      'pbs.org',
      'aljazeera.com',
      'economist.com',
      'ft.com',
      'propublica.org',
      'theintercept.com',
    ]
  },

  // Tier 3 — Major established outlets
  tier3: {
    label: 'Major Outlet',
    trust: 'high',
    weight: 0.65,
    color: '#f59e0b',
    domains: [
      'nytimes.com',
      'washingtonpost.com',
      'theguardian.com',
      'wsj.com',
      'usatoday.com',
      'cbsnews.com',
      'nbcnews.com',
      'abcnews.go.com',
      'thehill.com',
      'politico.com',
      'theatlantic.com',
      'newyorker.com',
      'bloomberg.com',
      'time.com',
      'latimes.com',
      'chicagotribune.com',
      'bostonchannel.com',
      'cbc.ca',
      'abc.net.au',
      'smh.com.au',
    ]
  },

  // Tier 4 — Known outlets, more editorial bias or lower standards
  tier4: {
    label: 'Known Outlet (use cautiously)',
    trust: 'moderate',
    weight: 0.4,
    color: '#ef4444',
    domains: [
      'cnn.com',
      'foxnews.com',
      'msnbc.com',
      'nypost.com',
      'dailymail.co.uk',
      'thesun.co.uk',
      'buzzfeednews.com',
      'vice.com',
      'vox.com',
      'axios.com',
      'huffpost.com',
      'salon.com',
      'breitbart.com',
      'dailywire.com',
      'newsweek.com',
      'independent.co.uk',
      'mirror.co.uk',
    ]
  }
};

function getSourceTier(url) {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    for (const [tier, data] of Object.entries(SOURCE_TIERS)) {
      if (data.domains.some(d => hostname === d || hostname.endsWith('.' + d))) {
        return {
          tier: parseInt(tier.replace('tier', '')),
          label: data.label,
          trust: data.trust,
          weight: data.weight,
          color: data.color,
          domain: hostname
        };
      }
    }
  } catch {}
  return null;
}

function getSourcePriorityText() {
  let text = 'SOURCE PRIORITY (use this ranking when weighing evidence):\n\n';
  for (const [tier, data] of Object.entries(SOURCE_TIERS)) {
    const num = tier.replace('tier', '');
    text += `TIER ${num} — ${data.label} (${data.trust} trust):\n`;
    text += data.domains.slice(0, 8).join(', ') + (data.domains.length > 8 ? '...' : '') + '\n\n';
  }
  text += 'UNRANKED sources: treat with skepticism. Do NOT cite blogs, social media posts, or unknown sites as primary evidence.\n';
  return text;
}

function assessResults(searchResults) {
  if (!Array.isArray(searchResults)) return [];

  const decorated = searchResults.map(result => {
    const tierInfo = getSourceTier(result.url);
    return {
      ...result,
      tierInfo
    };
  });

  // Sort by tier (best first); unranked sources go to the end
  decorated.sort((a, b) => {
    const tierA = a.tierInfo ? a.tierInfo.tier : 99;
    const tierB = b.tierInfo ? b.tierInfo.tier : 99;
    return tierA - tierB;
  });

  return decorated;
}

module.exports = { SOURCE_TIERS, getSourceTier, getSourcePriorityText, assessResults };
