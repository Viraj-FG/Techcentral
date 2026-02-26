// Kaeva Fact-Check API — Cloudflare Pages Function
// Uses Google Gemini with Search Grounding for fact-checking
// Service Account auth via JWT

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
    label: 'Known Outlet', weight: 0.4,
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

function b64url(buf) {
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let str = '';
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importPrivateKey(pem) {
  const b64 = pem.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\s/g, '');
  const binary = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return crypto.subtle.importKey('pkcs8', binary, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
}

async function getAccessToken(env) {
  const sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/generative-language',
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  };
  const enc = new TextEncoder();
  const headerB64 = b64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = b64url(enc.encode(JSON.stringify(payload)));
  const sigInput = `${headerB64}.${payloadB64}`;
  const key = await importPrivateKey(sa.private_key);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(sigInput));
  const jwt = `${sigInput}.${b64url(sig)}`;
  const resp = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  const data = await resp.json();
  return data.access_token;
}

async function geminiFactCheck(claim, accessToken, mediaResult) {
  let sourcePriorityText = 'SOURCE PRIORITY:\n';
  for (const [tier, data] of Object.entries(SOURCE_TIERS)) {
    sourcePriorityText += `TIER ${tier.replace('tier','')}: ${data.label}\n`;
  }
  let prompt = `You are Kaeva, an AI fact-checker. Fact-check: "${claim}"\n\n${sourcePriorityText}`;
  if (mediaResult?.authenticityScore !== null) {
    prompt += `\nMedia: ${mediaResult.type}, authenticity ${(mediaResult.authenticityScore*100).toFixed(1)}%, verdict ${mediaResult.verdict}\n`;
  }
  prompt += `\nAt the END, include:\n\`\`\`json\n{"verdict":"TRUE|FALSE|MOSTLY_TRUE|MOSTLY_FALSE|MISLEADING|UNVERIFIED|SATIRE|OPINION","confidence":0.0-1.0,"explanation":"...","sources":[{"url":"...","title":"...","stance":"supports|contradicts|neutral"}]}\n\`\`\``;
  const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], tools: [{ google_search: {} }] }),
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.map(p => p.text).filter(Boolean).join('\n') || '';
  const groundingMeta = candidate?.groundingMetadata || {};
  const groundingSources = (groundingMeta.groundingChunks || []).map(c => ({ title: c.web?.title || '', url: c.web?.uri || '' }));
  return { text, groundingSources, searchQueries: groundingMeta.webSearchQueries || [] };
}

function parseVerdict(text) {
  if (!text) return { verdict: 'UNVERIFIED', confidence: 0.5, explanation: 'Failed', sources: [] };
  const m = text.match(/```json\s*([\s\S]*?)```/);
  if (m) {
    try {
      const p = JSON.parse(m[1].trim());
      return { verdict: p.verdict || 'UNVERIFIED', confidence: typeof p.confidence === 'number' ? (p.confidence > 1 ? p.confidence/100 : p.confidence) : 0.5, explanation: p.explanation || '', sources: Array.isArray(p.sources) ? p.sources : [] };
    } catch {}
  }
  return { verdict: 'UNVERIFIED', confidence: 0.5, explanation: text.slice(0, 300), sources: [] };
}

async function analyzeMedia(mediaUrl, platform = 'clean') {
  const HF_SPACE = 'https://vi0509-kaeva-verify.hf.space';
  try {
    const mediaRes = await fetch(mediaUrl);
    if (!mediaRes.ok) return null;
    const contentType = mediaRes.headers.get('content-type') || '';
    const buffer = await mediaRes.arrayBuffer();
    let type = 'image', endpoint = '/image';
    if (contentType.includes('video')) { type = 'video'; endpoint = '/video'; }
    else if (contentType.includes('audio')) { type = 'audio'; endpoint = '/audio'; }
    const filename = mediaUrl.split('/').pop()?.split('?')[0] || `file.${type==='image'?'jpg':type==='video'?'mp4':'wav'}`;
    const boundary = '----K' + Math.random().toString(36).slice(2);
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const headerBytes = new TextEncoder().encode(header);
    const footerBytes = new TextEncoder().encode(footer);
    const bodyBytes = new Uint8Array(headerBytes.length + buffer.byteLength + footerBytes.length);
    bodyBytes.set(headerBytes, 0);
    bodyBytes.set(new Uint8Array(buffer), headerBytes.length);
    bodyBytes.set(footerBytes, headerBytes.length + buffer.byteLength);
    const url = `${HF_SPACE}${endpoint}${type!=='audio'?`?platform=${platform}`:''}`;
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` }, body: bodyBytes.buffer });
    if (!res.ok) return { type, authenticityScore: null, notes: `ML failed (${res.status})` };
    const result = await res.json();
    const fakeProbability = result.scores?.fake ?? 0.5;
    return { type, filename, verdict: result.verdict, authenticityScore: Math.round((1-fakeProbability)*10000)/10000, scores: result.scores, ensemble_scores: result.ensemble_scores, platform, model: result.model, version: result.version };
  } catch (e) {
    return { type: 'unknown', authenticityScore: null, notes: `Error: ${e.message}` };
  }
}

async function extractText(mediaUrl) {
  const HF_SPACE = 'https://vi0509-kaeva-verify.hf.space';
  try {
    const mediaRes = await fetch(mediaUrl);
    if (!mediaRes.ok) return null;
    const buffer = await mediaRes.arrayBuffer();
    const contentType = mediaRes.headers.get('content-type') || 'image/jpeg';
    const filename = mediaUrl.split('/').pop()?.split('?')[0] || 'image.jpg';
    const boundary = '----O' + Math.random().toString(36).slice(2);
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const headerBytes = new TextEncoder().encode(header);
    const footerBytes = new TextEncoder().encode(footer);
    const bodyBytes = new Uint8Array(headerBytes.length + buffer.byteLength + footerBytes.length);
    bodyBytes.set(headerBytes, 0);
    bodyBytes.set(new Uint8Array(buffer), headerBytes.length);
    bodyBytes.set(footerBytes, headerBytes.length + buffer.byteLength);
    const res = await fetch(`${HF_SPACE}/ocr`, { method: 'POST', headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` }, body: bodyBytes.buffer });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function calculateConfidence({ sourceAgreement, sourceQuality, aiConfidence, mediaAuthenticity }) {
  const sa = Math.max(0, Math.min(1, sourceAgreement || 0));
  const sq = Math.max(0, Math.min(1, sourceQuality || 0));
  const ai = Math.max(0, Math.min(1, aiConfidence || 0));
  let score, breakdown;
  if (mediaAuthenticity !== null && mediaAuthenticity !== undefined) {
    const ma = Math.max(0, Math.min(1, mediaAuthenticity));
    score = sa*0.30 + sq*0.20 + ai*0.35 + ma*0.15;
    breakdown = { sourceAgreement: sa, sourceQuality: sq, aiConfidence: ai, mediaAuthenticity: ma };
  } else {
    score = sa*0.35 + sq*0.25 + ai*0.40;
    breakdown = { sourceAgreement: sa, sourceQuality: sq, aiConfidence: ai };
  }
  score = Math.round(score*10000)/10000;
  const recommendation = score >= 0.75 ? 'HIGH_CONFIDENCE' : score >= 0.50 ? 'NEEDS_REVIEW' : 'LOW_CONFIDENCE';
  return { score, breakdown, recommendation };
}

const analyses = new Map();

async function runPipeline(analysisId, claim, mediaUrl, platform, env) {
  const entry = { status: 'processing', progress: 10 };
  analyses.set(analysisId, entry);
  try {
    const accessToken = await getAccessToken(env);
    entry.progress = 20;
    let mediaResult = null, ocrResult = null;
    if (mediaUrl) {
      [mediaResult, ocrResult] = await Promise.all([analyzeMedia(mediaUrl, platform).catch(() => null), extractText(mediaUrl).catch(() => null)]);
    }
    entry.progress = 40;
    let effectiveClaim = claim;
    if (!effectiveClaim && ocrResult?.text) effectiveClaim = ocrResult.text;
    let geminiResult = null;
    if (effectiveClaim) geminiResult = await geminiFactCheck(effectiveClaim, accessToken, mediaResult);
    entry.progress = 70;
    const parsed = parseVerdict(geminiResult?.text);
    entry.progress = 80;
    const allSources = [];
    for (const s of parsed.sources) {
      const tierInfo = s.url ? getSourceTier(s.url) : null;
      allSources.push({ title: s.title || '', url: s.url || '', stance: s.stance || 'neutral', tier: tierInfo?.tier || null, tierLabel: tierInfo?.label || 'Unranked' });
    }
    if (geminiResult?.groundingSources) {
      const existingUrls = new Set(allSources.map(s => s.url));
      for (const gs of geminiResult.groundingSources) {
        if (!existingUrls.has(gs.url)) {
          const tierInfo = getSourceTier(gs.url);
          allSources.push({ title: gs.title, url: gs.url, stance: 'referenced', tier: tierInfo?.tier || null, tierLabel: tierInfo?.label || 'Unranked' });
        }
      }
    }
    let supportsCount = 0, contradictsCount = 0;
    for (const s of parsed.sources) {
      if (s.stance === 'supports') supportsCount++;
      else if (s.stance === 'contradicts') contradictsCount++;
    }
    const totalStanced = supportsCount + contradictsCount;
    const sourceAgreement = totalStanced > 0 ? supportsCount / totalStanced : 0.5;
    let totalWeight = 0, weightedCount = 0;
    for (const s of allSources) {
      const tierInfo = s.url ? getSourceTier(s.url) : null;
      if (tierInfo) { totalWeight += tierInfo.weight; weightedCount++; }
    }
    const sourceQuality = weightedCount > 0 ? totalWeight / weightedCount : 0.3;
    const mediaAuth = mediaResult?.authenticityScore ?? null;
    const conf = calculateConfidence({ sourceAgreement, sourceQuality, aiConfidence: parsed.confidence, mediaAuthenticity: mediaAuth });
    const result = {
      analysisId, inputType: mediaResult ? (effectiveClaim ? 'text+media' : mediaResult.type) : 'text',
      claim: effectiveClaim, originalClaim: claim || null, verdict: parsed.verdict, explanation: parsed.explanation,
      confidence: conf.score, confidenceBreakdown: conf.breakdown, recommendation: conf.recommendation,
      sources: allSources, searchQueries: geminiResult?.searchQueries || [], mediaAnalysis: mediaResult,
      textExtraction: ocrResult, searchEngine: 'google', llmProvider: 'gemini-2.0-flash', timestamp: new Date().toISOString()
    };
    analyses.set(analysisId, { status: 'complete', progress: 100, result });
    return result;
  } catch (e) {
    console.error('Pipeline error:', e);
    analyses.set(analysisId, { status: 'error', progress: 0, error: e.message });
    return null;
  }
}

function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '');
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  if (path === '/api/health' && request.method === 'GET') {
    return jsonResponse({ ok: true, service: 'kaeva-factcheck', version: '3.0.0', endpoints: ['/api/analyze', '/api/status/:id', '/api/result/:id', '/api/media', '/api/ocr', '/api/health'], hfSpace: 'https://vi0509-kaeva-verify.hf.space', searchEngine: 'google', llmProvider: 'gemini-2.0-flash', googleAuth: env.GOOGLE_SERVICE_ACCOUNT_JSON ? 'configured' : 'not configured' });
  }
  if (path === '/api/analyze' && request.method === 'POST') {
    let body;
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) body = await request.json();
    else if (ct.includes('multipart/form-data')) { const formData = await request.formData(); body = { claim: formData.get('claim'), mediaUrl: formData.get('mediaUrl'), platform: formData.get('platform') }; }
    else body = await request.json().catch(() => ({}));
    const claim = body.claim || '';
    const mediaUrl = body.mediaUrl || body.media_url || null;
    const platform = body.platform || 'clean';
    if (!claim && !mediaUrl) return jsonResponse({ error: 'Provide claim or mediaUrl' }, 400);
    const analysisId = crypto.randomUUID();
    context.waitUntil(runPipeline(analysisId, claim, mediaUrl, platform, env));
    return jsonResponse({ analysisId, status: 'processing' }, 202);
  }
  const statusMatch = path.match(/^\/api\/status\/(.+)$/);
  if (statusMatch && request.method === 'GET') {
    const entry = analyses.get(statusMatch[1]);
    if (!entry) return jsonResponse({ error: 'Not found' }, 404);
    return jsonResponse({ status: entry.status, progress: entry.progress });
  }
  const resultMatch = path.match(/^\/api\/result\/(.+)$/);
  if (resultMatch && request.method === 'GET') {
    const entry = analyses.get(resultMatch[1]);
    if (!entry) return jsonResponse({ error: 'Not found' }, 404);
    if (entry.status !== 'complete') return jsonResponse({ status: entry.status, progress: entry.progress, message: 'Processing' }, 202);
    return jsonResponse(entry.result);
  }
  if (path === '/api/media' && request.method === 'POST') {
    let body;
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) body = await request.json();
    else body = await request.json().catch(() => ({}));
    const mediaUrl = body.mediaUrl || body.url || body.media_url;
    const platform = body.platform || 'clean';
    if (!mediaUrl) return jsonResponse({ error: 'Provide mediaUrl' }, 400);
    const result = await analyzeMedia(mediaUrl, platform);
    return jsonResponse(result || { error: 'Failed' });
  }
  if (path === '/api/ocr' && request.method === 'POST') {
    let body;
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) body = await request.json();
    else body = await request.json().catch(() => ({}));
    const mediaUrl = body.mediaUrl || body.url;
    if (!mediaUrl) return jsonResponse({ error: 'Provide mediaUrl' }, 400);
    const result = await extractText(mediaUrl);
    return jsonResponse(result || { error: 'OCR failed' });
  }
  return env.ASSETS.fetch(request);
}
