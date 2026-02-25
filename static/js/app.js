// app.js — Form submission, polling, and result rendering for Kaeva

(function () {
  const form = document.getElementById('analyzeForm');
  const submitBtn = document.getElementById('submitBtn');
  const claimEl = document.getElementById('claim');
  const charCount = document.getElementById('charCount');
  const progressSection = document.getElementById('progressSection');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const errorSection = document.getElementById('errorSection');
  const errorText = document.getElementById('errorText');
  const retryBtn = document.getElementById('retryBtn');

  if (!form) return;

  // Character counter
  if (claimEl && charCount) {
    claimEl.addEventListener('input', () => {
      charCount.textContent = claimEl.value.length;
    });
  }

  // Retry button
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      errorSection.hidden = true;
      submitBtn.disabled = false;
    });
  }

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const claim = claimEl ? claimEl.value.trim() : '';
    const fileInput = document.getElementById('mediaInput');
    const file = fileInput && fileInput.files.length > 0 ? fileInput.files[0] : null;

    if (!claim && !file) {
      showError('Please enter a claim or upload a media file.');
      return;
    }

    // Build FormData
    const formData = new FormData();
    if (claim) formData.append('claim', claim);
    if (file) formData.append('media', file);

    submitBtn.disabled = true;
    errorSection.hidden = true;
    progressSection.hidden = false;
    updateProgress(0, 'Submitting...');

    try {
      // Submit
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error (${res.status})`);
      }

      const { analysisId } = await res.json();
      updateProgress(5, 'Analysis started...');

      // Poll for progress
      await pollForResult(analysisId);
    } catch (err) {
      showError(err.message);
      progressSection.hidden = true;
    }
  });

  async function pollForResult(analysisId) {
    const POLL_INTERVAL = 1500;
    const MAX_POLLS = 120; // ~3 minutes max

    for (let i = 0; i < MAX_POLLS; i++) {
      await sleep(POLL_INTERVAL);

      try {
        const res = await fetch(`/api/status/${analysisId}`);
        if (!res.ok) {
          throw new Error(`Status check failed (${res.status})`);
        }

        const data = await res.json();
        updateProgress(data.progress || 0, data.progressMessage || `Processing... (${data.progress}%)`);

        if (data.status === 'complete') {
          // Fetch full result
          const resultRes = await fetch(`/api/result/${analysisId}`);
          if (!resultRes.ok) {
            throw new Error('Failed to fetch results');
          }
          const result = await resultRes.json();
          renderResult(result);
          return;
        }

        if (data.status === 'error') {
          throw new Error(data.error || 'Analysis failed');
        }
      } catch (err) {
        showError(err.message);
        progressSection.hidden = true;
        return;
      }
    }

    showError('Analysis timed out. Please try again.');
    progressSection.hidden = true;
  }

  function updateProgress(pct, message) {
    progressBar.style.width = pct + '%';
    progressText.textContent = message;
  }

  function showError(msg) {
    errorText.textContent = msg;
    errorSection.hidden = false;
    submitBtn.disabled = false;
  }

  function renderResult(result) {
    progressSection.hidden = true;

    // Remove existing result if any
    const existing = document.getElementById('resultSection');
    if (existing) existing.remove();

    const section = document.createElement('div');
    section.id = 'resultSection';
    section.className = 'result-section';

    const verdictClass = 'verdict-' + (result.verdict || 'UNVERIFIED');
    const verdictLabel = (result.verdict || 'UNVERIFIED').replace(/_/g, ' ');
    const confidencePct = Math.round((result.confidence || 0) * 100);
    const confClass = confidencePct >= 75 ? 'confidence-high' : confidencePct >= 50 ? 'confidence-mid' : 'confidence-low';

    let html = `
      <div class="verdict-card">
        <span class="verdict-badge ${verdictClass}">${verdictLabel}</span>
        <p class="verdict-explanation">${escapeHtml(result.explanation || '')}</p>
        <div class="confidence-meter">
          <div class="confidence-label">
            <span>Confidence</span>
            <span>${confidencePct}%</span>
          </div>
          <div class="confidence-bar-wrapper">
            <div class="confidence-bar ${confClass}" style="width: ${confidencePct}%"></div>
          </div>
        </div>
        ${result.recommendation ? `<p style="color: var(--text-muted); font-size: 0.85rem;">Recommendation: <strong>${escapeHtml(result.recommendation)}</strong></p>` : ''}
      </div>
    `;

    // Sources
    if (result.sources && result.sources.length > 0) {
      html += '<div class="sources-section"><h3>Sources</h3>';
      for (const src of result.sources) {
        const stanceClass = src.stance ? 'stance-' + src.stance : 'stance-neutral';
        const tierColor = src.tier ? getTierColor(src.tier) : 'var(--text-muted)';
        const tierLabel = src.tierLabel || 'Unranked';
        html += `
          <div class="source-item">
            <span class="source-tier" style="background: ${tierColor}22; color: ${tierColor};">${tierLabel}</span>
            <div class="source-info">
              <div class="source-title"><a href="${escapeHtml(src.url || '#')}" target="_blank" rel="noopener">${escapeHtml(src.title || 'Untitled')}</a></div>
              ${src.snippet ? `<div class="source-snippet">${escapeHtml(src.snippet)}</div>` : ''}
            </div>
            <span class="source-stance ${stanceClass}">${src.stance || 'neutral'}</span>
          </div>
        `;
      }
      html += '</div>';
    }

    // Media analysis
    if (result.mediaAnalysis) {
      const ma = result.mediaAnalysis;
      html += `<div class="media-section"><h3>Media Analysis — ${escapeHtml(ma.filename || 'file')}</h3>`;
      if (ma.authenticityScore !== null && ma.authenticityScore !== undefined) {
        const authPct = Math.round(ma.authenticityScore * 100);
        html += `<p style="margin-bottom: 0.5rem;">Authenticity: <strong>${authPct}%</strong></p>`;
      }
      if (ma.deepfakeIndicators && ma.deepfakeIndicators.length > 0) {
        html += '<ul class="media-indicators">';
        for (const ind of ma.deepfakeIndicators) {
          html += `<li>${escapeHtml(ind)}</li>`;
        }
        html += '</ul>';
      }
      if (ma.notes) {
        html += `<p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.5rem;">${escapeHtml(ma.notes)}</p>`;
      }
      html += '</div>';
    }

    // New analysis button
    html += '<div style="text-align: center; margin-top: 2rem;"><button class="btn btn-secondary" onclick="location.reload()">New Analysis</button></div>';

    section.innerHTML = html;

    // Hide form, show result
    form.hidden = true;
    form.parentNode.appendChild(section);
  }

  function getTierColor(tier) {
    const colors = { 1: '#22c55e', 2: '#3b82f6', 3: '#f59e0b', 4: '#ef4444' };
    return colors[tier] || '#8888a0';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
})();
