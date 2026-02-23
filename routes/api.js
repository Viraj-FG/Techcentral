const crypto = require('crypto');
const config = require('../lib/config');
const pipeline = require('../lib/factCheckPipeline');
const express = require('express');
const router = express.Router();

// POST /analyze - Main analysis endpoint
router.post('/analyze', (req, res, next) => {
  const upload = req.app.locals.upload;
  upload.single('media')(req, res, (err) => {
    if (err) return next(err);

    const claim = req.body.claim;
    const file = req.file;

    if (!claim && !file) {
      return res.status(400).json({ error: 'Please provide a claim text and/or upload a media file.' });
    }

    const analysisId = crypto.randomUUID();
    const filePath = req.file?.path || null;

    // Fire and forget - don't await
    pipeline.run(analysisId, claim || '', filePath);

    return res.status(202).json({ analysisId, status: 'processing' });
  });
});

// GET /status/:id - Poll for progress
router.get('/status/:id', (req, res) => {
  const result = pipeline.getStatus(req.params.id);

  if (result === null) {
    return res.status(404).json({ error: 'Analysis not found' });
  }

  return res.status(200).json(result);
});

// GET /result/:id - Get full result
router.get('/result/:id', (req, res) => {
  const status = pipeline.getStatus(req.params.id);
  if (!status) {
    return res.status(404).json({ error: 'Analysis not found' });
  }
  if (status.status !== 'complete') {
    return res.status(202).json({ status: status.status, progress: status.progress, message: 'Analysis still in progress' });
  }

  const result = pipeline.getResult(req.params.id);
  if (!result) {
    return res.status(500).json({ error: 'Result missing despite completed status' });
  }
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }
  return res.status(200).json(result);
});

// GET /health - Health check
router.get('/health', (req, res) => {
  return res.status(200).json({
    ok: true,
    service: 'kaeva-deepfake-checker',
    uptime: process.uptime(),
    services: {
      openclaw: config.openclaw.token ? 'configured' : 'not configured',
      braveSearch: config.brave.apiKey ? 'configured' : 'not configured'
    }
  });
});

module.exports = router;
