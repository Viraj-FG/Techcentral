// Kaeva V10 Media Analyzer — calls HF Space ensemble API
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const HF_SPACE_URL = process.env.HF_SPACE_URL || 'https://vi0509-kaeva-verify.hf.space';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi'];
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.flac', '.m4a'];

/**
 * Detect platform from request context or default to 'clean'.
 */
function detectPlatform(source) {
  if (!source) return 'clean';
  const s = source.toLowerCase();
  if (s.includes('whatsapp')) return 'whatsapp';
  if (s.includes('instagram')) return 'instagram';
  if (s.includes('telegram')) return 'telegram';
  if (s.includes('screenshot')) return 'screenshot';
  return 'clean';
}

/**
 * Analyze an uploaded media file using Kaeva V10 ensemble.
 *
 * @param {string|null} filePath - Absolute path to the media file
 * @param {string} [source] - Source platform hint (whatsapp/instagram/telegram/screenshot)
 * @returns {Promise<object|null>} Analysis result or null if no file
 */
async function analyze(filePath, source) {
  if (!filePath) return null;

  const filename = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const isImage = IMAGE_EXTENSIONS.includes(ext);
  const isVideo = VIDEO_EXTENSIONS.includes(ext);
  const isAudio = AUDIO_EXTENSIONS.includes(ext);
  const type = isImage ? 'image' : isVideo ? 'video' : isAudio ? 'audio' : 'unknown';
  const platform = detectPlatform(source);

  if (type === 'unknown') {
    return {
      filename, type,
      deepfakeIndicators: [],
      authenticityScore: null,
      notes: 'Unsupported file type',
    };
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const endpoint = type === 'audio' ? '/audio' : type === 'video' ? '/video' : '/image';
    const url = `${HF_SPACE_URL}${endpoint}${type !== 'audio' ? `?platform=${platform}` : ''}`;

    console.log(`[mediaAnalyzer] V10 ${type} analysis: ${filename} (${(fileBuffer.length / 1024).toFixed(1)} KB) platform=${platform}`);

    // Build multipart form
    const formData = new FormData();
    formData.append('file', fileBuffer, { filename, contentType: getMimeType(ext) });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s timeout

    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[mediaAnalyzer] HF Space error ${res.status}: ${errText.slice(0, 200)}`);
      return {
        filename, type,
        deepfakeIndicators: [],
        authenticityScore: null,
        notes: `ML analysis failed (status ${res.status})`,
      };
    }

    const result = await res.json();

    // Map V10 response to Kaeva verdict format
    const fakeProbability = result.scores?.fake ?? result.overall_score ?? 0.5;
    const verdict = result.verdict || (fakeProbability > 0.5 ? 'fake' : 'real');
    const authenticityScore = 1 - fakeProbability; // 1.0 = authentic, 0.0 = fake

    const indicators = [];
    if (verdict === 'fake') {
      indicators.push(`V10 ensemble detected manipulation (${(fakeProbability * 100).toFixed(1)}% confidence)`);
    }

    // Add model-specific flags
    if (result.ensemble_scores) {
      for (const [model, score] of Object.entries(result.ensemble_scores)) {
        if (score > 0.7) {
          indicators.push(`${model}: high fake signal (${(score * 100).toFixed(1)}%)`);
        }
      }
    }

    // Video-specific flags
    if (result.flags) {
      indicators.push(...result.flags);
    }
    if (result.audio_verdict === 'fake') {
      indicators.push(`Audio deepfake detected (${(result.audio_scores?.fake * 100).toFixed(1)}%)`);
    }

    return {
      filename,
      type,
      verdict,
      deepfakeIndicators: indicators,
      authenticityScore: Math.round(authenticityScore * 10000) / 10000,
      confidence: result.confidence,
      scores: result.scores,
      ensemble_scores: result.ensemble_scores,
      platform,
      model: result.model || 'kaeva-v10-ensemble',
      version: result.version || '10.0.0',
      notes: verdict === 'fake'
        ? `This ${type} shows signs of AI manipulation or generation.`
        : `This ${type} appears authentic based on V10 ensemble analysis.`,
      // Video extras
      ...(type === 'video' ? {
        frame_scores: result.frame_scores,
        temporal_consistency: result.temporal_consistency,
        audio_verdict: result.audio_verdict,
        audio_scores: result.audio_scores,
        processing_time_ms: result.processing_time_ms,
      } : {}),
    };
  } catch (err) {
    console.error('[mediaAnalyzer] V10 analysis failed:', err.message);
    return {
      filename, type,
      deepfakeIndicators: [],
      authenticityScore: null,
      notes: `Analysis failed: ${err.message}`,
    };
  }
}

function getMimeType(ext) {
  const map = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4',
    '.webm': 'video/webm', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
    '.flac': 'audio/flac', '.m4a': 'audio/mp4',
  };
  return map[ext] || 'application/octet-stream';
}

module.exports = { analyze, detectPlatform };
