// Rule-based link scanner: parses a URL (never visits it) and scores explainable risk signals.
import { getBrand, SUPPORTED_BRANDS } from '@/data/provider';
import { levenshtein, normalizeHandle } from './riskEngine';

const SUSPICIOUS_TLDS = ['xyz', 'top', 'tk', 'ml', 'ga', 'cf', 'gq', 'click', 'example', 'zip', 'work', 'loan', 'buzz', 'rest', 'country', 'icu'];
const SCAM_WORDS = ['claim', 'cashback', 'refund', 'verify', 'login', 'free', 'prize', 'bonus', 'internship', 'apply', 'urgent', 'kyc', 'update'];
const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'cutt.ly', 'is.gd', 'rb.gy', 'shorturl.at', 'ow.ly'];
const IP_RE = /^\d{1,3}(\.\d{1,3}){3}$/;

// True when the whole input is a single URL-like token (http(s)://, www. or domain.tld/...).
export const looksLikeUrl = (s) => {
  const t = (s || '').trim();
  return /^(https?:\/\/|www\.)\S+$/i.test(t) || /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(\/\S*)?$/i.test(t);
};

function parse(raw) {
  const input = raw.trim();
  if (!input) return { error: 'Please paste a link to scan.' };
  try {
    const url = new URL(/^[a-z]+:\/\//i.test(input) ? input : `https://${input}`);
    const host = url.hostname.toLowerCase();
    if (!['http:', 'https:'].includes(url.protocol) || (!host.includes('.') && !IP_RE.test(host))) throw new Error();
    return { url, host, input };
  } catch {
    return { error: "That doesn't look like a valid link. Example: https://brand-offer.example/claim" };
  }
}

const isOfficial = (host, brand) => brand.officialDomains.some((d) => host === d || host.endsWith(`.${d}`));

// Brand whose name appears in, or closely resembles, the domain.
function matchBrand(host) {
  const tokens = host.split(/[.-]/).map(normalizeHandle);
  const flat = normalizeHandle(host);
  for (const name of SUPPORTED_BRANDS) {
    const key = normalizeHandle(name);
    if (flat.includes(key)) return { brand: getBrand(name), kind: 'contains' };
    if (tokens.some((t) => t.length >= 4 && levenshtein(t, key) <= 2)) return { brand: getBrand(name), kind: 'lookalike' };
  }
  return null;
}

function structureReasons({ url, host, input }) {
  const r = [];
  const labels = host.split('.');
  const tld = labels[labels.length - 1];
  if (url.protocol === 'http:') r.push({ name: 'No HTTPS', points: 15, reason: 'Uses unencrypted HTTP instead of HTTPS.' });
  if (SUSPICIOUS_TLDS.includes(tld)) r.push({ name: 'Suspicious TLD', points: 20, reason: `The '.${tld}' domain ending is common in throwaway scam sites.` });
  if (SHORTENERS.includes(host)) r.push({ name: 'URL shortener', points: 15, reason: `${host} hides the real destination.` });
  if (IP_RE.test(host)) r.push({ name: 'IP address', points: 20, reason: 'Uses a raw IP address instead of a domain name.' });
  if (host.includes('xn--')) r.push({ name: 'Punycode', points: 20, reason: 'Contains punycode (xn--), often used to fake letters.' });
  if (input.includes('@')) r.push({ name: "'@' in URL", points: 20, reason: "Contains '@', which can hide the real site behind a fake one." });
  if ((host.match(/-/g) || []).length >= 2) r.push({ name: 'Many hyphens', points: 10, reason: 'Domain has several hyphens, typical of lookalike domains.' });
  if (labels.length >= 4) r.push({ name: 'Long subdomain chain', points: 10, reason: `Domain has ${labels.length} parts, which can bury the real site.` });
  if (input.length > 75) r.push({ name: 'Very long URL', points: 5, reason: `URL is ${input.length} characters long.` });
  return r;
}

function keywordReason(url) {
  const text = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();
  const hits = SCAM_WORDS.filter((w) => text.includes(w));
  if (!hits.length) return null;
  return { name: 'Scam keywords', points: Math.min(24, hits.length * 8), reason: `Domain or path uses bait words: ${hits.map((h) => `'${h}'`).join(', ')}.` };
}

function brandReason(match) {
  if (!match) return null;
  const { brand, kind } = match;
  const official = brand.officialDomains.join(', ');
  return kind === 'contains'
    ? { name: 'Brand impersonation', points: 35, reason: `Uses the name '${brand.name}' but is not the official domain (${official}).` }
    : { name: 'Brand lookalike', points: 30, reason: `Domain closely resembles '${brand.name}' (official: ${official}).` };
}

export function verdictOf(score) {
  if (score >= 60) return { label: 'High Risk', key: 'high' };
  if (score >= 30) return { label: 'Suspicious', key: 'medium' };
  return { label: 'Safe', key: 'low' };
}

export function scanLink(raw) {
  const parsed = parse(String(raw || '').slice(0, 2000));
  if (parsed.error) return { error: parsed.error };
  const match = matchBrand(parsed.host);
  const base = { url: parsed.url.href, host: parsed.host, brand: match?.brand.name ?? null };
  if (match && isOfficial(parsed.host, match.brand)) {
    return { ...base, score: 0, verdict: verdictOf(0), official: true, reasons: [{ name: 'Official domain', points: 0, reason: `${parsed.host} is an official ${match.brand.name} domain.` }] };
  }
  const reasons = [brandReason(match), keywordReason(parsed.url), ...structureReasons(parsed)].filter(Boolean);
  const score = Math.min(100, reasons.reduce((s, r) => s + r.points, 0));
  if (!reasons.length) reasons.push({ name: 'No red flags', points: 0, reason: 'No risky patterns found in this link. Still only open links you trust.' });
  return { ...base, score, verdict: verdictOf(score), official: false, reasons };
}
