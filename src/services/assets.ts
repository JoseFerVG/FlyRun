export function assetUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '');
  return `${import.meta.env.BASE_URL}${clean}`;
}
