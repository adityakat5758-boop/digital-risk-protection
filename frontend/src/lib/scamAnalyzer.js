// Rule-based scam analyzer (English + Hinglish). Swap analyzeMessage's body for an AI model later.
import { getDomain } from './riskEngine';

export const CATEGORIES = {
  'Fake Giveaway': ['giveaway', 'winner', 'won', 'lucky draw', 'congratulations', 'prize', 'hamper', 'claim', 'free gift', 'badhai', 'inaam', 'jeeta', 'share this post', 'win'],
  Phishing: ['verify', 'kyc', 'suspended', 'login', 'update card', 'update your card', 'otp', 'password', 'expires', 'account blocked', 'click here', 'cashback', 'wallet'],
  'Fake Customer Support': ['customer care', 'helpline', 'support', 'refund', 'call now', 'whatsapp us', 'cancel your order', 'toll free', 'anydesk', 'teamviewer', 'atka'],
};

const URGENCY = ['urgent', 'within 24 hours', 'immediately', 'turant', 'abhi'];
const HINGLISH = ['hai', 'hain', 'aap', 'aapka', 'karein', 'ke', 'pe', 'ho', 'apna', 'hua', 'pehle', 'turant', 'inaam', 'badhai', 'paane', 'liye', 'bhejein', 'abhi', 'atka'];
const DEFAULT_OFFICIAL = ['zenvyra.in'];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Whole-word, case-insensitive matcher; spaces in phrases match any whitespace.
export const keywordRegex = (kw, flags = 'i') => new RegExp(`(?<![a-z])${escape(kw).replace(/ /g, '\\s+')}(?![a-z])`, flags);

const UPI_RE = /[a-z0-9][\w.-]*@[a-z]{2,}(?![\w]|\.\w)/gi;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/gi;
const PHONE_RE = /(?:\+91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b/g;
const LINK_RE = /\b(?:https?:\/\/)?(?:[a-z0-9-]+\.)+(?:com|in|ly|me|shop|net|org|co|io|xyz|app|link|info|store)(?:\/[^\s]*)?/gi;
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

// Synchronous core: keyword hits per category + boosters -> type and confidence.
export function analyzeText(text, { officialDomains = DEFAULT_OFFICIAL } = {}) {
  const hitsByCategory = Object.fromEntries(
    Object.entries(CATEGORIES).map(([cat, kws]) => [cat, kws.filter((kw) => keywordRegex(kw).test(text))])
  );
  const keywords = [...new Set(Object.values(hitsByCategory).flat())];
  const totalHits = Object.values(hitsByCategory).reduce((s, k) => s + k.length, 0);

  const entities = extractEntities(text);
  const badLinks = entities.links.filter((l) => !officialDomains.some((d) => getDomain(l) === d || getDomain(l).endsWith('.' + d)));
  const urgency = URGENCY.filter((u) => keywordRegex(u).test(text));
  const boosters = [
    badLinks.length && 'a non-official link',
    entities.phones.length && 'a phone number',
    entities.upis.length && 'a UPI ID',
    urgency.length && 'urgency pressure',
    MONEY_RE.test(text) && 'a request for money, OTP or an app install',
  ].filter(Boolean);

  const words = (text.toLowerCase().match(/[a-z]+/g) || []);
  const language = words.filter((w) => HINGLISH.includes(w)).length >= 2 ? 'Hinglish' : 'English';
  const base = { keywords: [...keywords, ...urgency], entities, badLinks, boosters, language, hitsByCategory, source: 'Rule-based' };

  if (totalHits === 0 && boosters.length === 0) {
    return { ...base, isScam: false, type: 'No scam indicators found', confidence: 0, explanation: 'No scam keywords, suspicious links, phone numbers, UPI IDs or payment requests were found.' };
  }

  const [type, top] = Object.entries(hitsByCategory).sort((a, b) => b[1].length - a[1].length)[0];
  const resolvedType = top.length ? type : 'Suspicious Message';
  const confidence = Math.min(95, 50 + 10 * totalHits + 5 * boosters.length);
  const kwText = keywords.slice(0, 4).map((k) => `"${k}"`).join(', ');
  const explanation = `Classified as ${resolvedType} because it ${kwText ? `uses ${kwText}` : 'shows scam patterns'}${boosters.length ? ` and contains ${boosters.join(', ')}` : ''}.`;
  return { ...base, isScam: true, type: resolvedType, confidence, explanation };
}

// Async entry point used by the UI; implementation can be swapped without touching the UI.
export async function analyzeMessage(text, options) {
  await new Promise((r) => setTimeout(r, 700));
  return analyzeText(text, options);
}
