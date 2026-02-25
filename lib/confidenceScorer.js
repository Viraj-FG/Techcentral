// Composite confidence scoring for Kaeva Deepfake News Checker

/**
 * Calculate a composite confidence score from multiple signal inputs.
 *
 * @param {object} params
 * @param {number} params.sourceAgreement - 0.0 to 1.0, how much sources agree
 * @param {number} params.sourceQuality  - 0.0 to 1.0, average tier weight of sources
 * @param {number} params.aiConfidence   - 0.0 to 1.0, AI model's self-reported confidence
 * @param {number|null} params.mediaAuthenticity - 0.0 to 1.0, or null if no media
 * @returns {{ score: number, breakdown: object, recommendation: string }}
 */
function calculate({ sourceAgreement, sourceQuality, aiConfidence, mediaAuthenticity }) {
  // Clamp inputs to 0-1 range
  const sa = clamp(sourceAgreement || 0);
  const sq = clamp(sourceQuality || 0);
  const ai = clamp(aiConfidence || 0);

  let score;
  let breakdown;

  if (mediaAuthenticity !== null && mediaAuthenticity !== undefined) {
    const ma = clamp(mediaAuthenticity);
    score = (sa * 0.35) + (sq * 0.25) + (ai * 0.30) + (ma * 0.10);
    breakdown = {
      sourceAgreement: sa,
      sourceQuality: sq,
      aiConfidence: ai,
      mediaAuthenticity: ma,
    };
  } else {
    score = (sa * 0.39) + (sq * 0.28) + (ai * 0.33);
    breakdown = {
      sourceAgreement: sa,
      sourceQuality: sq,
      aiConfidence: ai,
      mediaAuthenticity: null,
    };
  }

  // Round to 4 decimal places to avoid floating point noise
  score = Math.round(score * 10000) / 10000;

  let recommendation;
  if (score >= 0.75) {
    recommendation = 'AUTHENTIC';
  } else if (score >= 0.50) {
    recommendation = 'NEEDS_REVIEW';
  } else {
    recommendation = 'DUBIOUS';
  }

  return { score, breakdown, recommendation };
}

/**
 * Clamp a value between 0 and 1.
 */
function clamp(value) {
  return Math.max(0, Math.min(1, value));
}

module.exports = { calculate };
