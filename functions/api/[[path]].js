// Kaeva Fact-Check API — Cloudflare Pages Function
// POST /api/analyze — submit claim + optional media URL
// GET /api/status/:id — poll progress
// GET /api/result/:id — get final result
// GET /api/health — health check

// ─── In-memory KV (will reset on cold start, but CF Pages Functions are warm for ~30s) ───
const analyses = new Map();

// ─── Source Tiers ───
const SOURCE_TIERS = {
  tier1: {
    label: 'Fact-Check / Primary Source', weight: 1.0,
    domains: ['snopes.com','politifact.com','factcheck.org','fullfact.org','who.int','cdc.gov','nih.gov','nasa.gov','nature.com','science.org','thelancet.com','nejm.org','arxiv.org','pubmed.ncbi.nlm.nih.gov']
  },
  tier2: {
    label: 'Wire Service / Premium', weight: 0.85,
    domains: ['apnews.com','reuters.com','bbc.com','bbc.co.uk','npr.org','pbs.org','aljazeera.com','economist.com','ft.com','propublica.org']
  },
  tier3: {
    label: 'Major Outlet', weight: 0.65,
    domains: ['nytimes.com','washingtonpost.com','theguardian.com','wsj.com','usatoday.com','cbsnews.com','nbcnews.com','abcnews.go.com','bloomberg.com','time.com']
  },
  tier4: {
    label: 'Known Outlet (use cautiously)', weight: 0.4,
    domains: ['cnn.com','foxnews.com','msnbc.com','nypost.com','dailymail.co.uk','buzzfeednews.com','vice.com','vox.com','huffpost.com','newsweek.com']
  }
};

function getSourceTier(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    for (const [tier, data] of Object.entries(SOURCE_TIERS)) {
      if (data.domains.some(d => hostname === d || hostname.endsWith('.' + d))) {
        return { tier: parseInt(tier.replace('tier', '')), label: data.label, weight: data.weight };
      }
    }
  } catch {}
  return null;
}

// ─── Brave Search ───
async function braveSearch(claim, apiKey) {
  if (!apiKey) return [];
  const queries = [claim, `${claim} fact check`, `${claim} site:reuters.com OR site:apnews.com OR site:bbc.com`];
  const allResults = [];
  
  await Promise.all(queries.map(async (q) => {
    try {
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=10`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json', 'X-Subscription-Token': apiKey }
      });
      if (!res.ok) return;
      const data = await res.json();
      for (const r of (data.web?.results || [])) {
        allResults.push({ title: r.title || '', url: r.url || '', snippet: r.description || '' });
      }
    } catch {}
  }));

  // Deduplicate
  const seen = new Set();
  return allResults.filter(r => { if (seen.has(r.url)) return false; seen.add(r.url); return true; });
}

// ─── Media Analysis via HF Space ───
async function analyzeMedia(mediaUrl, platform = 'clean') {
  const HF_SPACE = 'https://vi0509-kaeva-verify.hf.space';
  try {
    // Fetch the media
    const mediaRes = await fetch(mediaUrl);
    if (!mediaRes.ok) return null;
    const contentType = mediaRes.headers.get('content-type') || '';
    const buffer = await mediaRes.arrayBuffer();
    
    let type = 'image';
    let endpoint = '/image';
    if (contentType.includes('video')) { type = 'video'; endpoint = '/video'; }
    else if (contentType.includes('audio')) { type = 'audio'; endpoint = '/audio'; }
    
    const filename = mediaUrl.split('/').pop()?.split('?')[0] || `file.${type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'wav'}`;
    
    // Build form data manually for CF Workers
    const boundary = '----KaevaFormBoundary' + Math.random().toString(36).slice(2);
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    
    const headerBytes = new TextEncoder().encode(header);
    const footerBytes = new TextEncoder().encode(footer);
    const bodyBytes = new Uint8Array(headerBytes.length + buffer.byteLength + footerBytes.length);
    bodyBytes.set(headerBytes, 0);
    bodyBytes.set(new Uint8Array(buffer), headerBytes.length);
    bodyBytes.set(footerBytes, headerBytes.length + buffer.byteLength);
    
    const url = `${HF_SPACE}${endpoint}${type !== 'audio' ? `?platform=${platform}` : ''}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: bodyBytes.buffer,
    });
    
    if (!res.ok) return { type, authenticityScore: null, notes: `ML analysis failed (${res.status})` };
    
    const result = await res.json();
    const fakeProbability = result.scores?.fake ?? 0.5;
    const indicators = [];
    if (result.verdict === 'fake') {
      indicators.push(`V10 ensemble: ${(fakeProbability * 100).toFixed(1)}% fake confidence`);
    }
    if (result.ensemble_scores) {
      for (const [model, score] of Object.entries(result.ensemble_scores)) {
        if (score > 0.7) indicators.push(`${model}: ${(score * 100).toFixed(1)}% fake`);
      }
    }
    
    return {
      type, filename,
      verdict: result.verdict,
      deepfakeIndicators: indicators,
      authenticityScore: Math.round((1 - fakeProbability) * 10000) / 10000,
      scores: result.scores,
      ensemble_scores: result.ensemble_scores,
      platform,
      model: result.model,
      version: result.version,
    };
  } catch (e) {
    return { type: 'unknown', authenticityScore: null, notes: `Media analysis error: ${e.message}` };
  }
}

// ─── OpenClaw Verdict Generation ───
async function generateVerdict(claim, assessedResults, mediaResult, env) {
  const url = env.OPENCLAW_GATEWAY_URL;
  const token = env.OPENCLAW_GATEWAY_TOKEN;
  if (!url || !token) return null;
  
  let sourcePriorityText = 'SOURCE PRIORITY:\n';
  for (const [tier, data] of Object.entries(SOURCE_TIERS)) {
    sourcePriorityText += `TIER ${tier.replace('tier','')}: ${data.label} — ${data.domains.slice(0,5).join(', ')}...\n`;
  }

  const systemPrompt = `You are Kaeva, an AI-powered news and deepfake verification system.
Analyze the following claim using the search evidence provided.

${sourcePriorityText}

INSTRUCTIONS:
1. Evaluate the claim against the search results.
2. Determine each source's stance (supports, contradicts, neutral).
3. Weigh evidence by source tier.
4. Provide a clear verdict.

At the END of your response, include this exact JSON block:
\`\`\`json
{"verdict":"TRUE|FALSE|MOSTLY_TRUE|MOSTLY_FALSE|MISLEADING|UNVERIFIED|SATIRE|OPINION","confidence":0-100,"explanation":"2-3 sentence explanation","sources":[{"url":"...","stance":"supports|contradicts|neutral"}]}
\`\`\``;

  let userMessage = `CLAIM: ${claim}\n\n`;
  if (assessedResults.length > 0) {
    userMessage += 'SEARCH EVIDENCE:\n';
    assessedResults.forEach((r, i) => {
      const tierLabel = r.tierInfo ? `[Tier ${r.tierInfo.tier}]` : '[Unranked]';
      userMessage += `${i+1}. ${tierLabel} ${r.title}\n   URL: ${r.url}\n   ${r.snippet}\n\n`;
    });
  } else {
    userMessage += 'No search results found.\n\n';
  }
  if (mediaResult && mediaResult.authenticityScore !== null) {
    userMessage += `MEDIA ANALYSIS: ${mediaResult.type}, authenticity=${(mediaResult.authenticityScore*100).toFixed(1)}%, verdict=${mediaResult.verdict}\n`;
  }

  try {
    const res = await fetch(`${url}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        model: 'openclaw',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

function parseVerdict(text) {
  if (!text) return { verdict: 'UNVERIFIED', confidence: 0, explanation: 'No response', sources: [] };
  const m = text.match(/```json\s*([\s\S]*?)```/);
  if (m) {
    try {
      const p = JSON.parse(m[1].trim());
      return {
        verdict: p.verdict || 'UNVERIFIED',
        confidence: typeof p.confidence === 'number' ? p.confidence / 100 : 0.5,
        explanation: p.explanation || '',
        sources: Array.isArray(p.sources) ? p.sources : [],
      };
    } catch {}
  }
  return { verdict: 'UNVERIFIED', confidence: 0.5, explanation: text.slice(0, 300), sources: [] };
}

// ─── Confidence Scorer ───
function calculateConfidence({ sourceAgreement, sourceQuality, aiConfidence, mediaAuthenticity }) {
  const sa = Math.max(0, Math.min(1, sourceAgreement || 0));
  const sq = Math.max(0, Math.min(1, sourceQuality || 0));
  const ai = Math.max(0, Math.min(1, aiConfidence || 0));
  
  let score, breakdown;
  if (mediaAuthenticity !== null && mediaAuthenticity !== undefined) {
    const ma = Math.max(0, Math.min(1, mediaAuthenticity));
    score = sa * 0.35 + sq * 0.25 + ai * 0.30 + ma * 0.10;
    breakdown = { sourceAgreement: sa, sourceQuality: sq, aiConfidence: ai, mediaAuthenticity: ma };
  } else {
    score = sa * 0.39 + sq * 0.28 + ai * 0.33;
    breakdown = { sourceAgreement: sa, sourceQuality: sq, aiConfidence: ai };
  }
  score = Math.round(score * 10000) / 10000;
  const recommendation = score >= 0.75 ? 'HIGH_CONFIDENCE' : score >= 0.50 ? 'NEEDS_REVIEW' : 'LOW_CONFIDENCE';
  return { score, breakdown, recommendation };
}

// ─── Run full pipeline ───
async function runPipeline(analysisId, claim, mediaUrl, platform, env) {
  const entry = { status: 'processing', progress: 10 };
  analyses.set(analysisId, entry);

  try {
    // Search + media in parallel
    entry.progress = 20;
    const [searchResults, mediaResult] = await Promise.all([
      braveSearch(claim, env.BRAVE_API_KEY).catch(() => []),
      mediaUrl ? analyzeMedia(mediaUrl, platform).catch(() => null) : Promise.resolve(null),
    ]);
    entry.progress = 50;

    // Assess sources
    const assessed = searchResults.map(r => ({ ...r, tierInfo: getSourceTier(r.url) }))
      .sort((a, b) => (a.tierInfo?.tier ?? 99) - (b.tierInfo?.tier ?? 99));
    entry.progress = 60;

    // Generate verdict
    const rawVerdict = await generateVerdict(claim, assessed, mediaResult, env);
    const parsed = parseVerdict(rawVerdict);
    entry.progress = 80;

    // Confidence
    let supportsCount = 0, contradictsCount = 0;
    for (const s of parsed.sources) {
      if (s.stance === 'supports') supportsCount++;
      else if (s.stance === 'contradicts') contradictsCount++;
    }
    const totalStanced = supportsCount + contradictsCount;
    const sourceAgreement = totalStanced > 0 ? supportsCount / totalStanced : 0.5;
    let totalWeight = 0, weightedCount = 0;
    for (const r of assessed) {
      if (r.tierInfo?.weight) { totalWeight += r.tierInfo.weight; weightedCount++; }
    }
    const sourceQuality = weightedCount > 0 ? totalWeight / weightedCount : 0.3;
    const mediaAuth = mediaResult?.authenticityScore ?? null;
    const conf = calculateConfidence({
      sourceAgreement, sourceQuality,
      aiConfidence: parsed.confidence,
      mediaAuthenticity: mediaAuth,
    });
    entry.progress = 90;

    // Assemble
    const result = {
      analysisId,
      inputType: mediaResult ? (claim ? 'text+media' : mediaResult.type) : 'text',
      claim,
      verdict: parsed.verdict,
      explanation: parsed.explanation,
      confidence: conf.score,
      confidenceBreakdown: conf.breakdown,
      recommendation: conf.recommendation,
      sources: assessed.map(s => ({
        title: s.title, url: s.url, snippet: s.snippet,
        tier: s.tierInfo?.tier || null, tierLabel: s.tierInfo?.label || 'Unranked',
        stance: parsed.sources.find(vs => vs.url === s.url)?.stance || 'neutral',
      })),
      mediaAnalysis: mediaResult,
      timestamp: new Date().toISOString(),
    };

    analyses.set(analysisId, { status: 'complete', progress: 100, result });
    return result;
  } catch (e) {
    analyses.set(analysisId, { status: 'error', progress: 0, error: e.message });
    return null;
  }
}

// ─── CORS helper ───
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

// ─── Main handler ───
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '');
  
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // GET /api/health
  if (path === '/api/health' && request.method === 'GET') {
    return jsonResponse({
      ok: true,
      service: 'kaeva-factcheck',
      version: '2.0.0',
      endpoints: ['/api/analyze', '/api/status/:id', '/api/result/:id', '/api/health'],
      hfSpace: 'https://vi0509-kaeva-verify.hf.space',
      braveSearch: env.BRAVE_API_KEY ? 'configured' : 'not configured',
      openclaw: env.OPENCLAW_GATEWAY_TOKEN ? 'configured' : 'not configured',
    });
  }

  // POST /api/analyze
  if (path === '/api/analyze' && request.method === 'POST') {
    let body;
    const ct = request.headers.get('content-type') || '';
    
    if (ct.includes('application/json')) {
      body = await request.json();
    } else if (ct.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = { claim: formData.get('claim'), mediaUrl: formData.get('mediaUrl'), platform: formData.get('platform') };
    } else {
      body = await request.json().catch(() => ({}));
    }
    
    const claim = body.claim || '';
    const mediaUrl = body.mediaUrl || body.media_url || null;
    const platform = body.platform || 'clean';
    
    if (!claim && !mediaUrl) {
      return jsonResponse({ error: 'Please provide a claim text and/or mediaUrl.' }, 400);
    }

    const analysisId = crypto.randomUUID();
    
    // Fire and forget — run in background via waitUntil
    context.waitUntil(runPipeline(analysisId, claim, mediaUrl, platform, env));
    
    return jsonResponse({ analysisId, status: 'processing' }, 202);
  }

  // GET /api/status/:id
  const statusMatch = path.match(/^\/api\/status\/(.+)$/);
  if (statusMatch && request.method === 'GET') {
    const entry = analyses.get(statusMatch[1]);
    if (!entry) return jsonResponse({ error: 'Analysis not found' }, 404);
    return jsonResponse({ status: entry.status, progress: entry.progress });
  }

  // GET /api/result/:id
  const resultMatch = path.match(/^\/api\/result\/(.+)$/);
  if (resultMatch && request.method === 'GET') {
    const entry = analyses.get(resultMatch[1]);
    if (!entry) return jsonResponse({ error: 'Analysis not found' }, 404);
    if (entry.status !== 'complete') {
      return jsonResponse({ status: entry.status, progress: entry.progress, message: 'Still processing' }, 202);
    }
    return jsonResponse(entry.result);
  }

  // POST /api/media — direct media analysis (no fact-check, just deepfake detection)
  if (path === '/api/media' && request.method === 'POST') {
    let body;
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      body = await request.json();
    } else if (ct.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = { mediaUrl: formData.get('mediaUrl') || formData.get('url'), platform: formData.get('platform') };
    } else {
      body = await request.json().catch(() => ({}));
    }
    
    const mediaUrl = body.mediaUrl || body.url || body.media_url;
    const platform = body.platform || 'clean';
    
    if (!mediaUrl) return jsonResponse({ error: 'Please provide a mediaUrl.' }, 400);
    
    const result = await analyzeMedia(mediaUrl, platform);
    return jsonResponse(result || { error: 'Analysis failed' });
  }

  // Not an API route — pass through
  return env.ASSETS.fetch(request);
}
