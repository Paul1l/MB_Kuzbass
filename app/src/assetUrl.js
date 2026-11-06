// Builds a public asset URL that works at localhost, from a file, and when the
// site is deployed in a subdirectory instead of a domain root.
// Адрес относительный (./assets/...), браузер достраивает его от адреса главной. Он одинаковый в готовом HTML
// (scripts/prerender-home.mjs) и в браузере, поэтому React подхватывает разметку без расхождений.
export function getAssetUrl(relativePath) {
  const cleanPath = String(relativePath).replace(/^\/+/, '');
  const configuredBase = import.meta.env.MB_ASSET_BASE || import.meta.env.BASE_URL || './';
  const base = configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`;
  return `${base}${cleanPath}`;
}
