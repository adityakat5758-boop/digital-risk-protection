// Fake app checker: explainable score per app listing.
import { getBand } from './bands';

export const DANGEROUS_PERMISSIONS = ['SMS', 'Contacts', 'Call Logs', 'Accessibility', 'Overlay'];

function brandRule(app, brand) {
  if (!app.title.toLowerCase().includes(brand.name.toLowerCase())) return null;
  return { name: 'Brand in title', points: 30, reason: `Title uses '${brand.name}' but it is not published by ${brand.officialDeveloper}.` };
}

// Developer check only applies to listings that reference the brand.
function developerRule(app, brand) {
  const key = brand.name.toLowerCase();
  const mentionsBrand = app.title.toLowerCase().includes(key) || app.developer.toLowerCase().includes(key);
  if (!mentionsBrand || app.developer === brand.officialDeveloper) return null;
  return { name: 'Developer mismatch', points: 30, reason: `Developer '${app.developer}' is not the official developer '${brand.officialDeveloper}'.` };
}

function permissionRule(dangerous) {
  if (dangerous.length >= 3) return { name: 'Dangerous permissions', points: 25, reason: `Requests ${dangerous.length} dangerous permissions (${dangerous.join(', ')}) often used to steal OTPs.` };
  if (dangerous.length) return { name: 'Dangerous permissions', points: 10, reason: `Requests sensitive permission${dangerous.length > 1 ? 's' : ''}: ${dangerous.join(', ')}.` };
  return null;
}

const installsRule = (app) => (app.installs < 10000 ? { name: 'Low installs', points: 10, reason: `Only ${app.installs.toLocaleString('en-IN')} installs, unlike the official app.` } : null);
const ratingRule = (app) => (app.rating < 3.5 ? { name: 'Low rating', points: 5, reason: `Rated ${app.rating} stars, users likely report problems.` } : null);

export function checkApp(app, brand) {
  const isOfficial = app.title === brand.officialApp && app.developer === brand.officialDeveloper;
  const dangerous = app.permissions.filter((p) => DANGEROUS_PERMISSIONS.includes(p));
  if (isOfficial) {
    return { score: 0, band: getBand(0), isOfficial, dangerous, reasons: [{ name: 'Official listing', points: 0, reason: `Title and developer match the official app by ${brand.officialDeveloper}.` }] };
  }

  const reasons = [brandRule(app, brand), developerRule(app, brand), permissionRule(dangerous), installsRule(app), ratingRule(app)].filter(Boolean);
  const score = Math.min(100, reasons.reduce((s, r) => s + r.points, 0));
  if (!reasons.length) reasons.push({ name: 'No impersonation', points: 0, reason: 'Listing does not reference the brand and requests no dangerous permissions.' });
  return { score, band: getBand(score), isOfficial, dangerous, reasons };
}
