// Builds a public asset URL that works at localhost, from a file, and under the
// /MB_Kuzbass/ subdirectory used by GitHub Pages.
export function getAssetUrl(relativePath) {
  const cleanPath = String(relativePath).replace(/^\/+/, '');
  const configuredBase = import.meta.env.BASE_URL || './';
  const base = configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`;
  const relativeUrl = `${base}${cleanPath}`;

  if (typeof document === 'undefined') return relativeUrl;
  return new URL(relativeUrl, document.baseURI).href;
}
