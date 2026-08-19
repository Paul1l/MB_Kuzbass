// Builds a public asset URL that works at localhost, from a file, and when the
// site is deployed in a subdirectory instead of a domain root.
export function getAssetUrl(relativePath) {
  const cleanPath = String(relativePath).replace(/^\/+/, '');
  const configuredBase = import.meta.env.BASE_URL || './';
  const base = configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`;
  const relativeUrl = `${base}${cleanPath}`;

  if (typeof document === 'undefined') return relativeUrl;
  return new URL(relativeUrl, document.baseURI).href;
}
