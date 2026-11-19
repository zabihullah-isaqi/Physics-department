import Portal from '../app/portal';
import {PublicAdmin} from './public-admin';
import content from './content.json';
import fa from './fa.json';
import ps from './ps.json';
import en from './en.json';
import {cmsCatalogue} from './cms-catalog';

const pilot = import.meta.env.MODE === 'cms-pilot';
export const publicCatalog = pilot ? {...content,content:cmsCatalogue()} : content;
const data = {...publicCatalog, user: null, saved: [], decks: []};
const publicEdition = {
  base: import.meta.env.BASE_URL.replace(/\/$/, ''),
  translations: {fa, ps, en},
};

export function publicApp(path: string) {
  if (pilot && path === '/admin') return <main className="wrap section" lang="fa" dir="rtl">
    <h1>آزمایش ویرایشگر درس</h1>
    <p>شاخهٔ آزمایشی <bdi>pilot/pages-cms</bdi> را در Pages CMS انتخاب کنید.</p>
    <a className="button dark" href="https://app.pagescms.org/">باز کردن Pages CMS</a>
  </main>;
  if (path === '/admin') return <PublicAdmin initial={content} base={publicEdition.base}/>;
  return <Portal initialData={data} initialPath={path} publicEdition={publicEdition}/>;
}
