import {hydrateRoot} from 'react-dom/client';
import {publicApp} from './public-app';
import '../app/globals.css';
import '../app/academy.css';
import '../app/portfolio.css';
import 'katex/dist/katex.min.css';
import './theme.css';

const root = document.getElementById('root');
if (root) hydrateRoot(root, publicApp(root.dataset.route || '/'));
