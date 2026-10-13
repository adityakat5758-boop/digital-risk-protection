// Data access layer. Every screen reads data only through these functions.
// Replace with real platform APIs (Meta Graph API, X API, Play Store data) here.
import seed from './seed.json';
import more from './seed_more.json';

const norm = (s) => (s || '').trim().toLowerCase();
const DATASETS = Object.fromEntries([seed, ...more.datasets].map((d) => [norm(d.brand.name), d]));

export const SUPPORTED_BRANDS = Object.values(DATASETS).map((d) => d.brand.name);

export const isSupportedBrand = (brand) => norm(brand) in DATASETS;

export const getBrand = (brand) => DATASETS[norm(brand)]?.brand ?? null;

export const getProfiles = (brand) => DATASETS[norm(brand)]?.profiles ?? [];

export const getMessages = (brand) => DATASETS[norm(brand)]?.messages ?? [];

export const getApps = (brand) => DATASETS[norm(brand)]?.apps ?? [];
