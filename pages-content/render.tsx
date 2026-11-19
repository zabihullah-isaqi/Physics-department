import {renderToString} from 'react-dom/server';
import {publicApp} from './public-app';

export function render(path: string) {
  return renderToString(publicApp(path));
}
