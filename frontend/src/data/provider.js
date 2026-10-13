// Data access layer. Every screen reads data only through these functions.
// Replace with real platform APIs (Meta Graph API, X API, Play Store data) here.
import seed from './seed.json';

const norm = (s) => (s || '').trim().toLowerCase();

export const isSupportedBrand = (brand) => norm(brand) === norm(seed.brand.name);

export const getBrand = (brand) => (isSupportedBrand(brand) ? seed.brand : null);

export const getProfiles = (brand) => (isSupportedBrand(brand) ? seed.profiles : []);

export const getMessages = (brand) => (isSupportedBrand(brand) ? seed.messages : []);

export const getApps = (brand) => (isSupportedBrand(brand) ? seed.apps : []);
