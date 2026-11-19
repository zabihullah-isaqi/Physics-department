export function publicPageHref(base: string, path: string, language: string) {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const match = path.match(/^([^?#]*)(.*)$/);
  if (!match) return path;
  const [, pathname, suffix] = match;
  if (/^\/api(?:\/|$)/.test(pathname)) return path;
  const page = pathname === '/collaborate' ? '/contact' : pathname;
  const prefix = language === 'fa' ? '' : '/' + language;
  return base + prefix + page.replace(/\/$/, '') + '/' + suffix;
}
