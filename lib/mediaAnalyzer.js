// Vision-based media analysis for Kaeva Deepfake News Checker
const fs = require('fs');
const path = require('path');
const config = require('./config');

// Map file extensions to MIME types
const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
};

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi'];

/**
 * Analyze an uploaded media file for deepfake indicators.
 *
 * @param {string|null} filePath - Absolute path to the media file, or null
 * @returns {Promise<object|null>} Analysis result or null if no file
 */
async function analyze(filePath) {
  if (!filePath) return null;

  const filename = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

  // Determine if image or video
  const isImage = IMAGE_EXTENSIONS.includes(ext);
  const isVideo = VIDEO_EXTENSIONS.includes(ext);
  const type = isImage ? 'image' : isVideo ? 'video' : 'unknown';

  // Video analysis is not yet supported
  if (isVideo) {
    return {
      filename,
      type: 'video',
      deepfakeIndicators: ['Video frame analysis not yet supported'],
      authenticityScore: null,
      notes: 'Video analysis requires frame extraction (planned for v2)',
    };
  }

  // Image analysis via OpenClaw vision
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    const { url, token, agentId, timeout } = config.openclaw;

    const systemPrompt = `You are a deepfake and media manipulation detection expert. Analyze the provided image for signs of manipulation or AI generation.

Look for these specific indicators:
1. Inconsistent lighting or shadows
2. Warped or distorted edges around subjects
3. Unnatural skin textures or smoothing
4. AI generation artifacts (e.g., extra fingers, asymmetric features, melted backgrounds)
5. Text anomalies (garbled, misspelled, or inconsistent text in the image)
6. Inconsistent reflections or perspectives
7. Compression artifacts that suggest editing
8. Metadata anomalies (if detectable from visual cues)

Respond with a JSON block:
\`\`\`json
{"authenticityScore": 0.0-1.0, "indicators": ["list of detected issues"], "notes": "brief summary"}
\`\`\`

Where authenticityScore 1.0 = definitely authentic, 0.0 = definitely manipulated.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: dataUrl },
          },
          {
            type: 'text',
            text: 'Analyze this image for deepfake indicators and manipulation signs.',
          },
        ],
      },
    ];

    const requestBody = JSON.stringify({
      model: 'openclaw',
      user: 'kaeva-factcheck',
      messages,
    });

    console.log(`[mediaAnalyzer] Analyzing image: ${filename} (${(fileBuffer.length / 1024).toFixed(1)} KB)`);

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
      console.error('[mediaAnalyzer] OpenClaw vision error:', res.status);
      return {
        filename,
        type,
        deepfakeIndicators: [],
        authenticityScore: null,
        notes: `Analysis failed: OpenClaw returned status ${res.status}`,
      };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || '';

    // Parse the JSON block from the response
    const jsonMatch = reply.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        return {
          filename,
          type,
          deepfakeIndicators: Array.isArray(parsed.indicators) ? parsed.indicators : [],
          authenticityScore: typeof parsed.authenticityScore === 'number' ? parsed.authenticityScore : null,
          notes: parsed.notes || '',
        };
      } catch (parseErr) {
        console.warn('[mediaAnalyzer] Failed to parse vision response JSON:', parseErr.message);
      }
    }

    // Fallback: return the raw response as notes
    return {
      filename,
      type,
      deepfakeIndicators: [],
      authenticityScore: null,
      notes: reply.slice(0, 500),
    };
  } catch (err) {
    console.error('[mediaAnalyzer] Analysis failed:', err.message);
    return {
      filename,
      type,
      deepfakeIndicators: [],
      authenticityScore: null,
      notes: `Analysis failed: ${err.message}`,
    };
  }
}

module.exports = { analyze };
