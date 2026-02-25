const express = require('express');
const router = express.Router();

// Root redirects to landing page
router.get('/', (req, res) => {
  res.redirect('/static/index.html');
});

module.exports = router;
