// Simple text processing utilities for Kaeva Deepfake News Checker

const QUESTION_STARTERS = [
  'who', 'what', 'where', 'when', 'why', 'how',
  'is', 'are', 'was', 'were',
  'do', 'does', 'did',
  'can', 'could',
  'will', 'would', 'should',
];

/**
 * Normalize a claim: trim whitespace, collapse multiple spaces, cap length.
 *
 * @param {string} text - Raw claim text
 * @returns {string} Normalized text
 */
function normalize(text) {
  if (!text || typeof text !== 'string') return '';
  return text.trim().replace(/\s+/g, ' ').slice(0, 5000);
}

/**
 * Determine if the text is phrased as a question.
 * Returns true if it starts with a question word or ends with '?'.
 *
 * @param {string} text - The text to check
 * @returns {boolean}
 */
function isQuestion(text) {
  if (!text || typeof text !== 'string') return false;

  const trimmed = text.trim();

  // Ends with question mark
  if (trimmed.endsWith('?')) return true;

  // Starts with a question word (case-insensitive, word boundary)
  const firstWord = trimmed.split(/\s+/)[0].toLowerCase();
  return QUESTION_STARTERS.includes(firstWord);
}

module.exports = { normalize, isQuestion };
