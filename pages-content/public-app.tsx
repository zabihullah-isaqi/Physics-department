import Portal from '../app/portal';
import content from './content.json';
import fa from './fa.json';
import ps from './ps.json';
import en from './en.json';

const data = {...content, user: null, saved: [], decks: []};
const publicEdition = {
  base: import.meta.env.BASE_URL.replace(/\/$/, ''),
  translations: {fa, ps, en},
};

export function publicApp(path: string) {
  return <Portal initialData={data} initialPath={path} publicEdition={publicEdition}/>;
}
