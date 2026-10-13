// Profile risk engine: score = sum of explainable signals, each {name, points, reason}.
import { getBand } from './bands';

export const WEIGHTS = [
  { name: 'Username lookalike', max: 30, rule: 'Exact after char swaps +30, edit distance <= 2 +25, contains brand +20' },
  { name: 'Copied bio', max: 20, rule: 'Word overlap with official bio >= 70% +20, 40-70% +10' },
  { name: 'Logo reuse', max: 15, rule: 'Logo similarity >= 0.85 +15' },
  { name: 'New account', max: 15, rule: 'Under 30 days +15, 30-90 days +8' },
  { name: 'Follower ratio', max: 10, rule: 'Followers/following < 0.05 and following > 500 +10; follows more than follow it (following > 1000) +5' },
  { name: 'Suspicious link', max: 10, rule: 'Non-official domain that is a shortener, wa.me, t.me or uses the brand name +10' },
  { name: 'Scam bait in bio', max: 25, rule: 'Bio asks for OTP/card/bank data, upfront fees, promises rewards, pushes off-platform contact or urgency: 2+ kinds +25, 1 kind +10 (skipped for copied bios)' },
];

// Kinds of scam bait looked for in a profile bio.
const BAIT = [
  { kind: 'asks for sensitive data', re: /\b(otp|upi pin|pin|cvv|card details|card number|bank details|bank account|id number)\b/i },
  { kind: 'demands an upfront fee', re: /\b(pay rs|processing fee|registration|joining fee|upfront)\b/i },
  { kind: 'promises rewards', re: /\b(cashback|win|won|free|giveaway|prize|scholarship|guarantee|instant (?:loan|refund)|earn|without an exam|no documents)\b/i },
  { kind: 'fake support', re: /\b(helpline|refunds?|kyc|dm us|customer care|support)\b/i },
  { kind: 'engagement bait', re: /(follow \+ share|share with \d+ friends|tag \d+ friends)/i },
  { kind: 'off-platform contact', re: /(\+91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b/ },
  { kind: 'urgency', re: /\b(limited|hurry|today|now|within \d+)\b/i },
];

const CHAR_MAP = { 0: 'o', 1: 'l', 3: 'e', 4: 'a', 5: 's', $: 's' };
const SHORTENERS = ['bit.ly', 'tinyurl.com', 'goo.gl', 'cutt.ly', 'is.gd', 't.co', 'rb.gy'];

// Lowercase, undo common character swaps and drop separators.
export function normalizeHandle(handle) {
  return handle
    .toLowerCase()
    .replace(/^@/, '')
    .split('')
    .map((c) => CHAR_MAP[c] ?? c)
    .join('')
    .replace(/[._\-\s]/g, '');
}

// Classic Levenshtein edit distance.
export function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

const tokens = (text) => new Set((text || '').toLowerCase().match(/[a-z0-9]+/g) || []);

// Jaccard similarity of word-token sets.
export function jaccard(a, b) {
  const A = tokens(a);
  const B = tokens(b);
  if (!A.size || !B.size) return 0;
  const inter = [...A].filter((t) => B.has(t)).length;
  return inter / (A.size + B.size - inter);
}

export const getDomain = (link) =>
  (link || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

const isOfficialDomain = (domain, officialDomains) =>
  officialDomains.some((d) => domain === d || domain.endsWith('.' + d));

function usernameSignal(handle, brandKey) {
  const name = 'Username lookalike';
  const normalized = normalizeHandle(handle);
  const swaps = [...new Set(handle.toLowerCase().split('').filter((c) => CHAR_MAP[c]))].map((c) => `${c}->${CHAR_MAP[c]}`);
  if (normalized === brandKey && handle.toLowerCase() !== brandKey)
    return { name, points: 30, reason: `Username '${handle}' matches the brand after normalizing ${swaps.length ? `character swaps (${swaps.join(', ')})` : 'separators'}.` };
  const dist = levenshtein(normalized, brandKey);
  if (dist <= 2 && normalized !== brandKey)
    return { name, points: 25, reason: `Username '${handle}' is only ${dist} character${dist > 1 ? 's' : ''} away from '${brandKey}'.` };
  if (normalized.includes(brandKey))
    return { name, points: 20, reason: `Username '${handle}' contains the brand name '${brandKey}'.` };
  // Misspelled brand inside the handle, e.g. 'paynnest.official' or 'learnovva'.
  const tokens = handle.toLowerCase().split(/[._\-]/).map(normalizeHandle);
  const prefixes = [-1, 1].map((d) => normalized.slice(0, brandKey.length + d));
  const misspelt = [...tokens, ...prefixes].find((t) => t.length >= brandKey.length - 1 && levenshtein(t, brandKey) === 1);
  if (misspelt)
    return { name, points: 25, reason: `Username '${handle}' hides a 1-character misspelling of the brand ('${misspelt}' vs '${brandKey}').` };
  return { name, points: 0, reason: 'Username does not resemble the brand.' };
}

function baitSignal(bio, copied) {
  const name = 'Scam bait in bio';
  if (copied) return { name, points: 0, reason: 'Bio is copied from the official account (scored under Copied bio).' };
  const kinds = BAIT.filter((b) => b.re.test(bio || '')).map((b) => b.kind);
  if (kinds.length >= 2) return { name, points: 25, reason: `Bio ${kinds.join(', ')}.` };
  if (kinds.length === 1) return { name, points: 10, reason: `Bio ${kinds[0]}.` };
  return { name, points: 0, reason: 'No scam bait found in the bio.' };
}

function bioSignal(bio, officialBio) {
  const name = 'Copied bio';
  const sim = jaccard(bio, officialBio);
  const pct = Math.round(sim * 100);
  if (sim >= 0.7) return { name, points: 20, reason: `Bio is ${pct}% identical to the official bio (word overlap).` };
  if (sim >= 0.4) return { name, points: 10, reason: `Bio partially copies the official bio (${pct}% word overlap).` };
  return { name, points: 0, reason: `Bio is original (${pct}% overlap with the official bio).` };
}

function logoSignal(similarity = 0) {
  const name = 'Logo reuse';
  const pct = Math.round(similarity * 100);
  if (similarity >= 0.85) return { name, points: 15, reason: `Profile picture is ${pct}% similar to the official logo.` };
  return { name, points: 0, reason: `Profile picture is not a logo copy (${pct}% similarity).` };
}

function ageSignal(days) {
  const name = 'New account';
  if (days < 30) return { name, points: 15, reason: `Account was created only ${days} day${days === 1 ? '' : 's'} ago.` };
  if (days <= 90) return { name, points: 8, reason: `Account is relatively new (${days} days old).` };
  return { name, points: 0, reason: `Account is established (${days} days old).` };
}

function ratioSignal(followers, following) {
  const name = 'Follower ratio';
  const ratio = following ? followers / following : Infinity;
  if (ratio < 0.05 && following > 500)
    return { name, points: 10, reason: `Follows ${following.toLocaleString('en-IN')} accounts but has only ${followers.toLocaleString('en-IN')} followers (ratio ${ratio.toFixed(2)}), a typical fake-account pattern.` };
  if (following > followers && following > 1000)
    return { name, points: 5, reason: `Follows more accounts (${following.toLocaleString('en-IN')}) than follow it (${followers.toLocaleString('en-IN')}), a follow-for-follow pattern.` };
  return { name, points: 0, reason: 'Follower to following ratio looks normal.' };
}

function linkSignal(link, brandKey, officialDomains) {
  const name = 'Suspicious link';
  if (!link) return { name, points: 0, reason: 'No link in bio.' };
  const domain = getDomain(link);
  if (isOfficialDomain(domain, officialDomains)) return { name, points: 0, reason: `Link points to an official domain (${domain}).` };
  if (SHORTENERS.includes(domain)) return { name, points: 10, reason: `Link uses a URL shortener (${domain}) that hides the real destination.` };
  if (domain === 'wa.me') return { name, points: 10, reason: 'Link sends visitors to a personal WhatsApp chat (wa.me).' };
  if (domain === 't.me') return { name, points: 10, reason: 'Link redirects to an unofficial Telegram channel (t.me).' };
  if (domain.replace(/[-.]/g, '').includes(brandKey)) return { name, points: 10, reason: `Link '${domain}' uses the brand name but is not an official domain.` };
  return { name, points: 0, reason: `Link (${domain}) is not brand-related.` };
}

// Scores one profile against the official brand. Verified accounts score 0.
export function scoreProfile(profile, brand) {
  if (profile.verified) {
    return { score: 0, band: getBand(0), signals: [{ name: 'Verified account', points: 0, reason: 'Platform-verified account, treated as genuine.' }] };
  }
  const brandKey = normalizeHandle(brand.name);
  const bio = bioSignal(profile.bio, brand.bio);
  const signals = [
    usernameSignal(profile.handle, brandKey),
    bio,
    logoSignal(profile.logoSimilarity),
    ageSignal(profile.accountAgeDays),
    ratioSignal(profile.followers, profile.following),
    linkSignal(profile.link, brandKey, brand.officialDomains),
    baitSignal(profile.bio, bio.points === 20),
  ];
  const score = Math.min(100, signals.reduce((s, x) => s + x.points, 0));
  return { score, band: getBand(score), signals };
}

// Highest-weighted triggered signal, used as the "top reason" chip.
export const topSignal = (risk) => [...risk.signals].sort((a, b) => b.points - a.points)[0];
