import {env} from 'cloudflare:workers';
import {db} from './lib';
import {languageConfig} from './languages';
export async function configuredLanguages(){const r:any=await db().prepare("SELECT value FROM settings WHERE id='language_config'").first();return languageConfig(r?.value)}
export function translationConnection(){const e=env as any;return {available:!!e.TRANSLATION_OPENAI_API_KEY,provider:'OpenAI',model:e.TRANSLATION_MODEL||'gpt-5-mini'}}
