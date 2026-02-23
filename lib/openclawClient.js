// OpenClaw Chat Completions client for Kaeva Deepfake News Checker
const config = require('./config');
const sources = require('./sources');

/**
 * Generate a fact-check verdict by sending claim + evidence to OpenClaw.
 *
 * @param {string} claim - The normalized claim text
 * @param {Array} searchResults - Assessed search results with tier info
 * @param {object|null} mediaAnalysis - Media analysis result (or null)
 * @returns {Promise<string|null>} Raw response text from OpenClaw, or null on failure
 */
async function generateVerdict(claim, searchResults, mediaAnalysis) {
  const { url, token, agentId, timeout } = config.openclaw;

  const systemPrompt = `You are Kaeva, an AI-powered news and deepfake verification system.
Analyze the following claim using the search evidence provided. Determine if it is true, false, misleading, or unverifiable.

${sources.getSourcePriorityText()}

INSTRUCTIONS:
1. Evaluate the claim against the search results provided.
2. Determine each source's stance (supports, contradicts, or neutral).
3. Weigh evidence by source tier.
4. Provide a clear verdict.

At the END of your response, include this exact JSON block:
\`\`\`json
{"verdict":"TRUE|FALSE|MOSTLY_TRUE|MOSTLY_FALSE|MISLEADING|UNVERIFIED|SATIRE|OPINION","confidence":0-100,"explanation":"2-3 sentence explanation","sources":[{"url":"...","stance":"supports|contradicts|neutral"}]}
\`\`\``;

  // Build user message with evidence
  let userMessage = `CLAIM: ${claim}\n\n`;

  if (searchResults && searchResults.length > 0) {
    userMessage += 'SEARCH EVIDENCE:\n';
    searchResults.forEach((result, i) => {
      const tierLabel = result.tierInfo ? `[Tier ${result.tierInfo.tier} - ${result.tierInfo.label}]` : '[Unranked]';
      userMessage += `${i + 1}. ${tierLabel} ${result.title}\n   URL: ${result.url}\n   Snippet: ${result.snippet}\n\n`;
    });
  } else {
    userMessage += 'SEARCH EVIDENCE: No search results found.\n\n';
  }

  if (mediaAnalysis) {
    userMessage += 'MEDIA ANALYSIS:\n';
    userMessage += `  File: ${mediaAnalysis.filename}\n`;
    userMessage += `  Type: ${mediaAnalysis.type}\n`;
    if (mediaAnalysis.authenticityScore !== null && mediaAnalysis.authenticityScore !== undefined) {
      userMessage += `  Authenticity Score: ${(mediaAnalysis.authenticityScore * 100).toFixed(1)}%\n`;
    }
    if (mediaAnalysis.deepfakeIndicators && mediaAnalysis.deepfakeIndicators.length > 0) {
      userMessage += `  Deepfake Indicators: ${mediaAnalysis.deepfakeIndicators.join(', ')}\n`;
    }
    if (mediaAnalysis.notes) {
      userMessage += `  Notes: ${mediaAnalysis.notes}\n`;
    }
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  try {
    const requestBody = JSON.stringify({
      model: 'openclaw',
      user: 'kaeva-factcheck',
      messages,
    });

    console.log(`[openclawClient] Sending to OpenClaw: ${messages.length} messages, ${requestBody.length} bytes`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const res = await fetch(`${url}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-openclaw-agent-id': agentId,
      },
      body: requestBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.error('[openclawClient] OpenClaw error:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    let reply = data.choices?.[0]?.message?.content;
    if (!reply) return null;

    reply = reply.replace(/\bNO_REPLY\b/g, '').replace(/\bHEARTBEAT_OK\b/g, '').trim();
    return reply || null;
  } catch (err) {
    console.error('[openclawClient] OpenClaw error:', err.name, err.message);
    return null;
  }
}

/**
 * Parse the verdict response from OpenClaw to extract the structured JSON block.
 * Falls back to regex-based extraction if JSON parsing fails.
 *
 * @param {string} responseText - The raw response text from OpenClaw
 * @returns {object} Parsed verdict object with verdict, confidence, explanation, sources
 */
function parseVerdictResponse(responseText) {
  if (!responseText) {
    return { verdict: 'UNVERIFIED', confidence: 0, explanation: 'No response received', sources: [] };
  }

  // Try to extract ```json ... ``` block
  const jsonBlockMatch = responseText.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1].trim());
      return {
        verdict: parsed.verdict || 'UNVERIFIED',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence / 100 : 0.5,
        explanation: parsed.explanation || 'No explanation provided',
        sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      };
    } catch (err) {
      console.warn('[openclawClient] JSON block found but failed to parse:', err.message);
    }
  }

  // Fallback: extract verdict type from text (ig-bridge pattern)
  const verdict = extractVerdictType(responseText);
  const confidence = extractConfidence(responseText);

  return {
    verdict,
    confidence,
    explanation: responseText.slice(0, 300),
    sources: [],
  };
}

/**
 * Extract verdict type from response text using keyword matching.
 * Fallback method based on ig-bridge pattern.
 */
function extractVerdictType(msg) {
  if (!msg) return 'UNVERIFIED';
  const l = msg.toLowerCase();
  if (l.includes('false') && !l.includes('mostly false')) return 'FALSE';
  if (l.includes('mostly false')) return 'MOSTLY_FALSE';
  if (l.includes('misleading')) return 'MISLEADING';
  if (l.includes('mostly true')) return 'MOSTLY_TRUE';
  if (l.includes('true') && !l.includes('mostly true')) return 'TRUE';
  if (l.includes('satire')) return 'SATIRE';
  if (l.includes('unverified')) return 'UNVERIFIED';
  if (l.includes('opinion')) return 'OPINION';
  return 'UNVERIFIED';
}

/**
 * Extract confidence percentage from response text.
 * Fallback method based on ig-bridge pattern.
 */
function extractConfidence(msg) {
  if (!msg) return 0;
  const m = msg.match(/confidence:\s*(\d+)%/i);
  return m ? parseInt(m[1]) / 100 : 0.5;
}

module.exports = { generateVerdict, parseVerdictResponse };
