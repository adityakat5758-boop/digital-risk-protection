// Rule-based scam analyzer (English + Hinglish). Swap analyzeMessage's body for an AI model later.
import { getDomain } from './riskEngine';

export const CATEGORIES = {
  'Fake Giveaway': ['giveaway', 'winner', 'won', 'lucky draw', 'congratulations', 'prize', 'hamper', 'claim', 'free gift', 'badhai', 'inaam', 'jeeta', 'share this post', 'win', 'scholarship'],
  Phishing: ['verify', 'kyc', 'suspended', 'login', 'update card', 'update your card', 'otp', 'password', 'expires', 'expire', 'expired', 'renew', 'account blocked', 'click here', 'cashback', 'wallet', 'upi pin', 'card number', 'cvv', 'bank account', 'id number'],
  'Fake Customer Support': ['customer care', 'helpline', 'support', 'refund', 'call now', 'whatsapp us', 'cancel your order', 'toll free', 'anydesk', 'teamviewer', 'atka'],
  'Advance Fee Scam': ['processing fee', 'registration fee', 'joining fee', 'pay rs', 'loan approved', 'uniform', 'offer letter', 'certificate', 'without giving the exam', 'placement guarantee'],
};

// Safety guidance typical of genuine brand messages.
const SAFE_RE = /never (?:ask|pay|charge)|is (?:always )?free|report anyone/i;

const URGENCY = ['urgent', 'within 24 hours', 'immediately', 'turant', 'abhi'];
const HINGLISH = ['hai', 'hain', 'aap', 'aapka', 'karein', 'ke', 'pe', 'ho', 'apna', 'hua', 'pehle', 'turant', 'inaam', 'badhai', 'paane', 'liye', 'bhejein', 'abhi', 'atka'];
const DEFAULT_OFFICIAL = ['zenvyra.in'];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Whole-word, case-insensitive matcher; spaces in phrases match any whitespace.
export const keywordRegex = (kw, flags = 'i') => new RegExp(`(?<![a-z])${escape(kw).replace(/ /g, '\\s+')}(?![a-z])`, flags);

const UPI_RE = /[a-z0-9][\w.-]*@[a-z]{2,}(?![\w]|\.\w)/gi;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/gi;
const PHONE_RE = /(?:\+91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b/g;
const LINK_RE = /\b(?:https?:\/\/)?(?:[a-z0-9-]+\.)+(?:com|in|ly|me|shop|net|org|co|io|xyz|app|link|info|store|example)(?:\/[^\s]*)?/gi;
const MONEY_RE = /\bpay\b|\bsend\s*(?:₹|rs\.?)\s*\d|\botp\b|\bdownload\b|\binstall\b|\btransfer\b/i;

const clean = (s) => s.replace(/[.,!?:;)]+$/, '');

// Pulls links, phone numbers and UPI IDs out of the message.
export function extractEntities(text) {
  const upis = (text.match(UPI_RE) || []).map(clean);
  const stripped = text.replace(EMAIL_RE, ' ').replace(UPI_RE, ' ');
  const links = [...new Set((stripped.match(LINK_RE) || []).map(clean))];
  const phones = [...new Set((text.match(PHONE_RE) || []).map((p) => p.trim()))];
  return { links, phones, upis: [...new Set(upis)] };
}

export const MAX_MESSAGE_LENGTH = 2000;

const SAFE_TYPE = 'No scam indicators found';

// Distinct keyword hits per scam category.
function categoryHits(text) {
  return Object.fromEntries(
    Object.entries(CATEGORIES).map(([cat, kws]) => [cat, kws.filter((kw) => keywordRegex(kw).test(text))])
  );
}

const isOfficialLink = (link, officialDomains) => {
  const domain = getDomain(link);
  return officialDomains.some((d) => domain === d || domain.endsWith('.' + d));
};

// Extra risk signals that raise confidence.
function findBoosters(text, entities, badLinks, urgency) {
  return [
    badLinks.length && 'a non-official link',
    entities.phones.length && 'a phone number',
    entities.upis.length && 'a UPI ID',
    urgency.length && 'urgency pressure',
    MONEY_RE.test(text) && 'a request for money, OTP or an app install',
  ].filter(Boolean);
}

function detectLanguage(text) {
  const words = text.toLowerCase().match(/[a-z]+/g) || [];
  return words.filter((w) => HINGLISH.includes(w)).length >= 2 ? 'Hinglish' : 'English';
}

// Returns an explanation if the message should be treated as safe, else null.
function safeReason(text, totalHits, base) {
  const noRiskyEntities = !base.badLinks.length && !base.entities.phones.length && !base.entities.upis.length;
  if (SAFE_RE.test(text) && noRiskyEntities) return 'Contains safety guidance (e.g. "never ask for OTP", "applying is free") and no risky links, phone numbers or UPI IDs.';
  if (totalHits === 0 && base.boosters.length === 0) return 'No scam keywords, suspicious links, phone numbers, UPI IDs or payment requests were found.';
  return null;
}

// Category with the most hits; falls back to a generic label when only boosters fired.
function topCategory(hitsByCategory) {
  const [type, top] = Object.entries(hitsByCategory).sort((a, b) => b[1].length - a[1].length)[0];
  return top.length ? type : 'Suspicious Message';
}

function explain(type, keywords, boosters) {
  const kwText = keywords.slice(0, 4).map((k) => `"${k}"`).join(', ');
  const uses = kwText ? `uses ${kwText}` : 'shows scam patterns';
  const contains = boosters.length ? ` and contains ${boosters.join(', ')}` : '';
  return `Classified as ${type} because it ${uses}${contains}.`;
}

// Synchronous core: keyword hits per category + boosters -> type and confidence.
export function analyzeText(rawText, { officialDomains = DEFAULT_OFFICIAL } = {}) {
  const text = String(rawText).slice(0, MAX_MESSAGE_LENGTH);
  const hitsByCategory = categoryHits(text);
  const keywords = [...new Set(Object.values(hitsByCategory).flat())];
  const totalHits = Object.values(hitsByCategory).reduce((s, k) => s + k.length, 0);

  const entities = extractEntities(text);
  const badLinks = entities.links.filter((l) => !isOfficialLink(l, officialDomains));
  const urgency = URGENCY.filter((u) => keywordRegex(u).test(text));
  const boosters = findBoosters(text, entities, badLinks, urgency);
  const base = { keywords: [...keywords, ...urgency], entities, badLinks, boosters, language: detectLanguage(text), hitsByCategory, source: 'Rule-based' };

  const safe = safeReason(text, totalHits, base);
  if (safe) return { ...base, isScam: false, type: SAFE_TYPE, confidence: 0, explanation: safe };

  const type = topCategory(hitsByCategory);
  const confidence = Math.min(95, 50 + 10 * totalHits + 5 * boosters.length);
  return { ...base, isScam: true, type, confidence, explanation: explain(type, keywords, boosters) };
}

// Async entry point used by the UI; implementation can be swapped without touching the UI.
export async function analyzeMessage(text, options) {
  await new Promise((r) => setTimeout(r, 700));
  return analyzeText(text, options);
}
