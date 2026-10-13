// Builds the threat network: brand at center, suspects linked by shared links, phones or lookalike usernames.
import { getDomain, levenshtein, normalizeHandle } from './riskEngine';
import { extractEntities } from './scamAnalyzer';

function fingerprint(profile, messages) {
  const texts = [profile.bio, profile.link, ...messages.filter((m) => m.linkedProfileId === profile.id).map((m) => m.text)].join(' ');
  const { links, phones } = extractEntities(texts);
  const domains = new Set([profile.link, ...links].filter(Boolean).map(getDomain));
  const phoneSet = new Set(phones.map((p) => p.replace(/\D/g, '').slice(-10)));
  const waPhone = (profile.link || '').match(/wa\.me\/(?:91)?(\d{10})/);
  if (waPhone) phoneSet.add(waPhone[1]);
  return { domains, phones: phoneSet, handle: normalizeHandle(profile.handle) };
}

export function buildThreatGraph(brand, profiles, messages) {
  const suspects = profiles.filter((p) => p.risk.score > 15);
  const fps = Object.fromEntries(suspects.map((p) => [p.id, fingerprint(p, messages)]));
  const nodes = [
    { id: 'brand', label: brand.name, isBrand: true, val: 40, color: '#2dd4bf', fx: 0, fy: 0, fz: 0 },
    ...suspects.map((p) => ({ id: p.id, label: `@${p.handle}`, score: p.risk.score, band: p.risk.band.key, val: Math.max(2, p.risk.score / 6) })),
  ];
  const links = suspects.map((p) => ({ source: 'brand', target: p.id, kind: 'impersonates' }));
  for (let i = 0; i < suspects.length; i++)
    for (let j = i + 1; j < suspects.length; j++) {
      const a = fps[suspects[i].id];
      const b = fps[suspects[j].id];
      const reasons = [];
      const domain = [...a.domains].find((d) => b.domains.has(d));
      if (domain) reasons.push(`shared link ${domain}`);
      if ([...a.phones].some((ph) => b.phones.has(ph))) reasons.push('shared phone');
      if (levenshtein(a.handle, b.handle) <= 2) reasons.push('similar username');
      if (reasons.length) links.push({ source: suspects[i].id, target: suspects[j].id, kind: 'shared', label: reasons.join(', ') });
    }
  return { nodes, links };
}
