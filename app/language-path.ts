import type {Language} from './languages';

export function splitLanguagePath(path: string, languages: Language[]) {
  const [, first, ...rest] = path.split('/');
  const language = languages.find(entry => entry.enabled && entry.code === first)?.code;
  return {language, path: language ? '/' + rest.join('/') : path};
}

export function isLanguageNeutralPath(path: string) {
  return /^\/(?:api|admin|teach|signin-with-chatgpt|signout-with-chatgpt|callback)(?:[/?#]|$)/.test(path);
}

export function languageHref(href: string, language: string, languages: Language[]) {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const boundary = href.search(/[?#]/);
  const path = boundary < 0 ? href : href.slice(0, boundary);
  const suffix = boundary < 0 ? '' : href.slice(boundary);
  const page = splitLanguagePath(path, languages).path;
  if (isLanguageNeutralPath(page) || /\.[a-z0-9]+$/i.test(page)) return href;
  return '/' + language + (page === '/' ? '/' : page) + suffix;
}
