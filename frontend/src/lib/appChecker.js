// Fake app checker: explainable score per app listing.
import { getBand } from './bands';

export const DANGEROUS_PERMISSIONS = ['SMS', 'Contacts', 'Call Logs', 'Accessibility', 'Overlay'];

export function checkApp(app, brand) {
  const isOfficial = app.title === brand.officialApp && app.developer === brand.officialDeveloper;
  const dangerous = app.permissions.filter((p) => DANGEROUS_PERMISSIONS.includes(p));
  if (isOfficial) {
    return { score: 0, band: getBand(0), isOfficial, dangerous, reasons: [{ name: 'Official listing', points: 0, reason: `Title and developer match the official app by ${brand.officialDeveloper}.` }] };
  }

  const brandKey = brand.name.toLowerCase();
  const brandInTitle = app.title.toLowerCase().includes(brandKey);
  const mentionsBrand = brandInTitle || app.developer.toLowerCase().includes(brandKey);
  const reasons = [];

  if (brandInTitle) reasons.push({ name: 'Brand in title', points: 30, reason: `Title uses '${brand.name}' but it is not published by ${brand.officialDeveloper}.` });
  // Developer check only applies to listings that reference the brand.
  if (mentionsBrand && app.developer !== brand.officialDeveloper)
    reasons.push({ name: 'Developer mismatch', points: 30, reason: `Developer '${app.developer}' is not the official developer '${brand.officialDeveloper}'.` });
  if (dangerous.length >= 3) reasons.push({ name: 'Dangerous permissions', points: 25, reason: `Requests ${dangerous.length} dangerous permissions (${dangerous.join(', ')}) often used to steal OTPs.` });
  else if (dangerous.length) reasons.push({ name: 'Dangerous permissions', points: 10, reason: `Requests sensitive permission${dangerous.length > 1 ? 's' : ''}: ${dangerous.join(', ')}.` });
  if (app.installs < 10000) reasons.push({ name: 'Low installs', points: 10, reason: `Only ${app.installs.toLocaleString('en-IN')} installs, unlike the official app.` });
  if (app.rating < 3.5) reasons.push({ name: 'Low rating', points: 5, reason: `Rated ${app.rating} stars, users likely report problems.` });

  const score = Math.min(100, reasons.reduce((s, r) => s + r.points, 0));
  if (!reasons.length) reasons.push({ name: 'No impersonation', points: 0, reason: 'Listing does not reference the brand and requests no dangerous permissions.' });
  return { score, band: getBand(score), isOfficial, dangerous, reasons };
}
