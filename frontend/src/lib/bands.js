// Shared risk bands: 70-100 High, 40-69 Medium, 0-39 Low.
export function getBand(score) {
  if (score >= 70) return { label: 'High', key: 'high' };
  if (score >= 40) return { label: 'Medium', key: 'medium' };
  return { label: 'Low', key: 'low' };
}
