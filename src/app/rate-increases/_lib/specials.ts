/**
 * Move-in specials live as free text in `tenant_activity.moveInDiscountPlan`
 * ("ABC 2nd month free", "50% Off First 3 Months!", "Half off 2nd Month"...).
 * Turn one into "how many months until the discount is over", which is when
 * the tenant's real rent starts and the rate-increase clock can begin.
 *
 * Returns null when the text isn't recognized, so unknown wording is
 * surfaced for review instead of silently treated as "no special".
 */
export function parseSpecialMonths(text: string | null | undefined): number | null {
  const raw = (text ?? "").trim();
  if (!raw) return 0;
  const t = raw
    .toLowerCase()
    .replace(/\babc\b/g, " ")
    .replace(/website special|limited time|special/g, " ")
    .replace(/[!.\-–—:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (t === "manual") return 0;
  // Prepaying is a price break, not a discounted period; no end date.
  if (/prepay/.test(t)) return 0;
  // A referral fee isn't a discounted period either.
  if (/referral/.test(t)) return 0;
  if (/\$\s*1\b.*move ?in|move ?in.*\$\s*1\b|\$\s*1 (?:first|1st) month/.test(t)) return 1;

  // "50% off 1st two months", "half off first three months"
  const words: Record<string, number> = { two: 2, three: 3, four: 4 };
  const w = t.match(/(?:50 ?%|half|1\/2) off (?:the )?(?:first |1st )?(two|three|four) months?\b/);
  if (w) return words[w[1]];

  const ordinal = (s: string): number | null => {
    const m = s.match(/\b(\d+)(?:st|nd|rd|th)?\b/);
    if (m) return parseInt(m[1], 10);
    if (/\bfirst\b/.test(s)) return 1;
    if (/\bsecond\b/.test(s)) return 2;
    if (/\bthird\b/.test(s)) return 3;
    return null;
  };

  // "2nd month free", "1st month free", "second month free"
  let m = t.match(/\b((?:\d+(?:st|nd|rd|th)?|first|second|third)) month free\b/);
  if (m) return ordinal(m[1]);

  // "50% off 3 months", "50% off first 2 months", "half off 3 months", "1/2 off 3 months"
  m = t.match(/(?:50 ?%|half|1\/2) off (?:the )?(?:first )?(\d+) months?\b/);
  if (m) return parseInt(m[1], 10);

  // "50% off 2nd month", "half off 2nd month", "50% off 1st month", "1/2 off first month"
  m = t.match(/(?:50 ?%|half|1\/2) off (?:the )?((?:\d+(?:st|nd|rd|th)?|first|second|third)) month\b/);
  if (m) return ordinal(m[1]);

  // "50% off first month special", "half off month"
  if (/(?:50 ?%|half|1\/2) off (?:the )?(?:first )?month\b/.test(t)) return 1;

  // "1 month free", "2 months free"
  m = t.match(/\b(\d+) months? free\b/);
  if (m) return parseInt(m[1], 10);

  return null;
}
