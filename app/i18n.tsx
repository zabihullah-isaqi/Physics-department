'use client';
import {useEffect,useRef,useState,createContext,useContext,isValidElement,cloneElement,type ReactNode} from 'react';
import {languageConfig} from './languages';
import {isLanguageNeutralPath,languageHref,splitLanguagePath} from './language-path';
import {uiTranslations} from './ui-translations';
import {shortHash,localizeContent,type SiteLanguage} from './translation-model';
const Context=createContext<{language:SiteLanguage;t:(s:string)=>string}>({language:'fa',t:s=>s});
export const LocaleProvider=Context.Provider;
export const useLocale=()=>useContext(Context);
export function translateTree(node:ReactNode,t:(s:string)=>string):ReactNode{if(typeof node==='string')return t(node);if(Array.isArray(node))return node.map(n=>translateTree(n,t));if(!isValidElement(node))return node;const props:any=node.props,updates:any={};if(props.children!==undefined)updates.children=translateTree(props.children,t);for(const k of ['title','placeholder','aria-label','alt'])if(typeof props[k]==='string')updates[k]=t(props[k]);if(typeof node.type==='function')for(const k of ['value','title','text','hint'])if(typeof props[k]==='string')updates[k]=t(props[k]);return cloneElement(node,updates)}
function rowKey(target:string,field:string){return JSON.stringify([target,field])}
export function useTranslationRuntime(rawData:any,pathname:string){const config=languageConfig(rawData?.settings?.language_config),languages=config.languages.filter(l=>l.enabled);const {path,language:prefix}=splitLanguagePath(pathname,languages);const [selected,setLanguage]=useState<SiteLanguage>(prefix||'fa'),[loaded,setLoaded]=useState<{language:string;rows:any[]}>({language:'',rows:[]}),[status,setStatus]=useState(''),[issue,setIssue]=useState(''),[retry,setRetry]=useState(0);const sequence=useRef(0);const language=languages.some(l=>l.code===selected)?selected:'fa';const active=['/admin','/teach'].includes(path)?'fa':language;const rows=loaded.language===active?loaded.rows:[];const lookupMap=new Map(rows.map(r=>[rowKey(r.target_id,r.field),r]));function lookup(target:string,field:string,source:string){return lookupMap.get(rowKey(target,field))?.translated||source}function t(source:string){if(typeof source!=='string')return source;let config:any={};try{config=JSON.parse(rawData?.settings?.site_config||'{}')}catch{}if(active==='fa')return config.overrides?.[source]??source;const trimmed=source.trim(),translated=lookupMap.get(rowKey('ui',shortHash(trimmed)))?.translated||(uiTranslations[trimmed] as any)?.[active];return translated?source.replace(trimmed,translated):source}
useEffect(()=>{
  const requested=splitLanguagePath(location.pathname,languages).language;
  const query=new URLSearchParams(location.search).get('lang');
  let saved:string|null=null;
  try{saved=localStorage.getItem('isaqi-language')}catch{}
  const available=(code:string|null)=>languages.some(l=>l.code===code);
  setLanguage(requested||(available(query)?query!:available(saved)?saved!:'fa'));
},[prefix,rawData?.settings?.language_config]);
useEffect(()=>{
  function keepLanguage(event: MouseEvent) {
    if (!(event.target instanceof Element) || isLanguageNeutralPath(path)) return;
    const link=event.target.closest<HTMLAnchorElement>('a[href]');
    const href=link?.getAttribute('href');
    if (!link || !href || link.hasAttribute('download')) return;
    if (language==='fa' && !splitLanguagePath(location.pathname,languages).language) return;
    link.setAttribute('href',languageHref(href,language,languages));
  }
  for (const event of ['click','auxclick','contextmenu'] as const) {
    document.addEventListener(event,keepLanguage,true);
  }
  return ()=>{
    for (const event of ['click','auxclick','contextmenu'] as const) {
      document.removeEventListener(event,keepLanguage,true);
    }
  };
},[language,path,rawData?.settings?.language_config]);
useEffect(()=>{document.documentElement.lang=active;document.documentElement.dir=languages.find(l=>l.code===active)?.dir||'rtl';},[language,active]);
useEffect(()=>{const run=++sequence.current;let stopped=false;setIssue('');if(!rawData)return;setStatus('ترجمه‌های ذخیره‌شده؛ بخش‌های ترجمه‌نشده به زبان اصلی نمایش داده می‌شوند.');fetch('/api/translations?lang='+active).then(async r=>{const d:any=await r.json();if(!r.ok)throw Error(d.error);if(!stopped&&sequence.current===run)setLoaded({language:active,rows:d.rows||[]})}).catch(e=>{if(!stopped)setIssue(e.message)});return()=>{stopped=true}},[active,path,rawData,retry]);
const data=rawData?{...rawData,content:(rawData.content||[]).map((c:any)=>{let base='fa';try{base=JSON.parse(c.meta||'{}').sourceLanguage||'fa'}catch{}let locked=false;try{locked=!!JSON.parse(c.meta||'{}').locked}catch{}return locked||active===base?c:localizeContent(c,(field,source)=>lookup(c.id,field,source))}),settings:Object.fromEntries(Object.entries(rawData.settings||{}).map(([key,value])=>[key,typeof value==='string'?lookup('settings',key,value):value]))}:rawData;
return {path,languages,language:active,selectedLanguage:language,setLanguage:(l:SiteLanguage)=>{setLanguage(l);try{localStorage.setItem('isaqi-language',l)}catch{}const u=new URL(location.href);if(!isLanguageNeutralPath(path)){u.pathname=languageHref(path,l,languages);u.searchParams.delete('lang');history.replaceState(history.state,'',u)}},rows,data,t,status,issue,retry:()=>setRetry(n=>n+1)}}
export function LocaleTextTree({children}:{children:ReactNode}){const {t}=useLocale();return translateTree(children,t)}
