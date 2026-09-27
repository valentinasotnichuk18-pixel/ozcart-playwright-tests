/**
 * Converts a price text like "$1,057.75" into a number (1057.75).
 * @param {string} text
 * @returns {number}
 */
function parsePrice(text) {
  const value = Number(text.replace(/[^0-9.]/g, ''));
  if (Number.isNaN(value)) {
    throw new Error(`Cannot parse price from "${text}"`);
  }
  return value;
}

/**
 * Formats a number as a price string in AUD, for example 57.75 -> "$57.75".
 * @param {number} value
 * @returns {string}
 */
function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}

module.exports = { parsePrice, formatPrice };
