require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT) || 3000,
  openclaw: {
    url: process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789',
    token: process.env.OPENCLAW_GATEWAY_TOKEN,
    agentId: process.env.OPENCLAW_AGENT_ID || 'wolfie',
    timeout: parseInt(process.env.OPENCLAW_TIMEOUT) || 120000,
  },
  brave: {
    apiKey: process.env.BRAVE_API_KEY,
    timeout: parseInt(process.env.BRAVE_TIMEOUT) || 15000,
  },
  upload: {
    maxSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB) || 50,
    dir: process.env.UPLOAD_DIR || 'uploads',
    allowedMimeTypes: [
      'image/jpeg', 'image/png', 'image/webp',
      'video/mp4', 'video/webm'
    ],
  }
};

if (!config.openclaw.token) console.warn('WARNING: OPENCLAW_GATEWAY_TOKEN not set');
if (!config.brave.apiKey) console.warn('WARNING: BRAVE_API_KEY not set -- search will be disabled');

module.exports = config;
