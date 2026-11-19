import {useEffect, useState} from 'react';
import {Moon, Sun} from 'lucide-react';
import {useLocale} from './i18n';

const labels: Record<string, [string, string]> = {
  fa: ['روشن‌کردن حالت شب', 'روشن‌کردن حالت روز'],
  ps: ['د شپې حالت فعالول', 'د ورځې حالت فعالول'],
  en: ['Switch to dark mode', 'Switch to light mode'],
};

export function PublicThemeToggle() {
  const {language} = useLocale();
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const system = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setDark(document.documentElement.dataset.theme === 'dark');
    const onSystemChange = () => {
      if (document.documentElement.dataset.themePreference === 'manual') return;
      document.documentElement.dataset.theme = system.matches ? 'dark' : 'light';
      sync();
    };
    sync();
    system.addEventListener('change', onSystemChange);
    return () => system.removeEventListener('change', onSystemChange);
  }, []);
  const title = (labels[language] || labels.fa)[dark ? 1 : 0];
  return <button
    type="button"
    className="lang-button public-theme-toggle"
    title={title}
    aria-label={title}
    onClick={() => {
      const theme = dark ? 'light' : 'dark';
      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.themePreference = 'manual';
      try { localStorage.setItem('isaqi-theme', theme); } catch {}
      setDark(!dark);
    }}
  >{dark ? <Sun size={19} aria-hidden="true"/> : <Moon size={19} aria-hidden="true"/>}</button>;
}
