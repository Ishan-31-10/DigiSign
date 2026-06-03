/**
 * Minimal duration parser that understands strings like "1h", "30m",
 * "7d", "45s" and plain numbers (interpreted as milliseconds).
 * Avoids pulling in another dependency for one helper.
 */
function parse(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  const m = /^(\d+)\s*(ms|s|m|h|d)?$/i.exec(value.trim());
  if (!m) return parseInt(value, 10) || 0;
  const n = parseInt(m[1], 10);
  const unit = (m[2] || 'ms').toLowerCase();
  const mult = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return n * mult;
}

export { parse };
