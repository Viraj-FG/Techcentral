// Fact-check pipeline orchestrator for Kaeva Deepfake News Checker
const claimAnalyzer = require('./claimAnalyzer');
const braveSearch = require('./braveSearch');
const mediaAnalyzer = require('./mediaAnalyzer');
const sources = require('./sources');
const openclawClient = require('./openclawClient');
const confidenceScorer = require('./confidenceScorer');

// In-memory store for analysis state and results
const analyses = new Map();

/**
 * Run the full fact-check pipeline for a given claim and optional media file.
 *
 * @param {string} analysisId  - Unique identifier for this analysis
 * @param {string} claimText   - The raw claim text to verify
 * @param {string|null} filePath - Path to an uploaded media file, or null
 */
async function run(analysisId, claimText, filePath) {
  // Initialize tracking entry
  analyses.set(analysisId, { status: 'processing', progress: 0 });

  try {
    // Step 1 (10%): Normalize claim
    const normalizedClaim = claimAnalyzer.normalize(claimText);
    updateProgress(analysisId, 10, 'Claim normalized');

    // Step 2 (20-60%): Search for evidence and analyze media in parallel
    updateProgress(analysisId, 20, 'Searching for evidence...');

    let searchResults = [];
    let mediaResult = null;

    try {
      const [searchRes, mediaRes] = await Promise.all([
        braveSearch.searchForEvidence(normalizedClaim).catch(err => {
          console.error('[pipeline] Brave search failed:', err.message);
          return [];
        }),
        mediaAnalyzer.analyze(filePath).catch(err => {
          console.error('[pipeline] Media analysis failed:', err.message);
          return null;
        }),
      ]);
      searchResults = searchRes || [];
      mediaResult = mediaRes;
    } catch (err) {
      console.error('[pipeline] Evidence gathering failed:', err.message);
    }

    updateProgress(analysisId, 60, 'Evidence gathered');

    // Step 3 (70%): Assess source tiers
    const assessedResults = sources.assessResults(searchResults);
    updateProgress(analysisId, 70, 'Sources assessed');

    // Step 4 (80%): Generate verdict via OpenClaw
    let parsedVerdict = { verdict: 'UNVERIFIED', confidence: 0, explanation: 'Unable to determine', sources: [] };

    try {
      const rawResponse = await openclawClient.generateVerdict(normalizedClaim, assessedResults, mediaResult);
      if (rawResponse) {
        parsedVerdict = openclawClient.parseVerdictResponse(rawResponse);
      } else {
        console.warn('[pipeline] OpenClaw returned no response, using UNVERIFIED');
      }
    } catch (err) {
      console.error('[pipeline] OpenClaw verdict failed:', err.message);
    }

    updateProgress(analysisId, 80, 'Verdict generated');

    // Step 5 (90%): Calculate composite confidence
    const verdictSources = parsedVerdict.sources || [];

    // Source agreement: ratio of supporting vs contradicting sources
    let supportsCount = 0;
    let contradictsCount = 0;
    for (const vs of verdictSources) {
      if (vs.stance === 'supports') supportsCount++;
      else if (vs.stance === 'contradicts') contradictsCount++;
    }
    const totalStanced = supportsCount + contradictsCount;
    const sourceAgreement = totalStanced > 0 ? supportsCount / totalStanced : 0.5;

    // Source quality: average tier weight of assessed results
    let totalWeight = 0;
    let weightedCount = 0;
    for (const result of assessedResults) {
      if (result.tierInfo && result.tierInfo.weight) {
        totalWeight += result.tierInfo.weight;
        weightedCount++;
      }
    }
    const sourceQuality = weightedCount > 0 ? totalWeight / weightedCount : 0.3;

    // AI confidence from parsed verdict
    const aiConfidence = parsedVerdict.confidence || 0.5;

    // Media authenticity (null if no media)
    const mediaAuthenticity = mediaResult && mediaResult.authenticityScore !== null && mediaResult.authenticityScore !== undefined
      ? mediaResult.authenticityScore
      : null;

    const confidenceResult = confidenceScorer.calculate({
      sourceAgreement,
      sourceQuality,
      aiConfidence,
      mediaAuthenticity,
    });

    updateProgress(analysisId, 90, 'Confidence calculated');

    // Step 6 (100%): Determine input type and assemble final verdict
    let inputType = 'text';
    if (mediaResult && normalizedClaim) {
      inputType = 'text+media';
    } else if (mediaResult) {
      inputType = mediaResult.type === 'video' ? 'video' : 'image';
    }

    const finalVerdict = {
      analysisId,
      inputType,
      claim: normalizedClaim,
      verdict: parsedVerdict.verdict || 'UNVERIFIED',
      explanation: parsedVerdict.explanation || 'Unable to determine',
      confidence: confidenceResult.score,
      confidenceBreakdown: confidenceResult.breakdown,
      sources: assessedResults.map(s => ({
        title: s.title,
        url: s.url,
        snippet: s.snippet,
        tier: s.tierInfo?.tier || null,
        tierLabel: s.tierInfo?.label || 'Unranked',
        stance: (parsedVerdict.sources || []).find(vs => vs.url === s.url)?.stance || 'neutral',
      })),
      mediaAnalysis: mediaResult,
      recommendation: confidenceResult.recommendation,
      timestamp: new Date().toISOString(),
    };

    analyses.set(analysisId, {
      status: 'complete',
      progress: 100,
      result: finalVerdict,
    });

    console.log(`[pipeline] Analysis ${analysisId} complete: ${finalVerdict.verdict} (${(finalVerdict.confidence * 100).toFixed(1)}% confidence)`);
    return finalVerdict;
  } catch (err) {
    console.error(`[pipeline] Analysis ${analysisId} failed:`, err.message);
    analyses.set(analysisId, {
      status: 'error',
      progress: 0,
      error: err.message,
    });
    return null;
  }
}

/**
 * Get the current status and progress of an analysis.
 *
 * @param {string} id - Analysis ID
 * @returns {{ status: string, progress: number } | null}
 */
function getStatus(id) {
  const entry = analyses.get(id);
  if (!entry) return null;
  return { status: entry.status, progress: entry.progress, progressMessage: entry.progressMessage || '' };
}

/**
 * Get the full result of a completed analysis.
 *
 * @param {string} id - Analysis ID
 * @returns {object | null}
 */
function getResult(id) {
  const entry = analyses.get(id);
  if (!entry) return null;
  if (entry.status === 'complete') return entry.result;
  if (entry.status === 'error') return { error: entry.error };
  return null;
}

/**
 * Update progress for an in-flight analysis.
 */
function updateProgress(analysisId, progress, message) {
  const entry = analyses.get(analysisId);
  if (entry) {
    entry.progress = progress;
    entry.progressMessage = message;
  }
  console.log(`[pipeline] ${analysisId}: ${progress}% - ${message}`);
}

module.exports = { run, getStatus, getResult };
