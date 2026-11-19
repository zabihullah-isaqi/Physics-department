import {useEffect, useRef, useState, type FormEvent} from 'react';
import {publishCatalog} from './github-publish';
import {publicPageHref} from '../app/public-path';
import {BookOpen, Download, FileText, Globe, History, Pencil, Plus, Search} from 'lucide-react';
import {RichTextEditor} from '../app/rich-text';
import {normalizeRich} from '../app/rich-text-model';
import {BlocksEditor, BlocksView} from '../app/content-blocks';
import {normalizeBlocks,type ContentBlock} from '../app/content-blocks-model';
import {Text} from '../app/portal';

const editUrl = 'https://github.com/zabihullah-isaqi/Physics-department/edit/main/pages-content/content.json';
const sourceUrl = 'https://raw.githubusercontent.com/zabihullah-isaqi/Physics-department/main/pages-content/content.json';
const kinds = {course:'درس',chapter:'فصل',lesson:'جلسه',lab:'آزمایش',article:'نوشته',research:'اثر پژوهشی',resource:'منبع'};
type Kind = keyof typeof kinds;
type Item = {
  id: string; type: Kind; title: string; summary: string; body: string;
  parent_id: string | null; category: string; status: 'published'; meta: string;
};
type Catalog = {content: Item[]; [key: string]: unknown};
const empty = {id:'',type:'course' as Kind,title:'',summary:'',body:'',parent:'',category:'',video:'',file:'',blocks:[] as ContentBlock[]};
const parentKind: Partial<Record<Kind, Kind>> = {chapter:'course',lesson:'chapter'};
const draftKey = 'isaqi-public-content-draft';
const historyUrl = 'https://github.com/zabihullah-isaqi/Physics-department/commits/main/pages-content/content.json';
type View = 'content'|'editor'|'media'|'languages'|'publish'|'history';

export function PublicAdmin({initial,base}:{initial:Catalog;base:string}) {
  const [catalog,setCatalog] = useState(initial);
  const [form,setForm] = useState(empty);
  const [status,setStatus] = useState('');
  const [ready,setReady] = useState(false);
  const [dirty,setDirty] = useState(false);
  const [publishing,setPublishing] = useState(false);
  const source = useRef('');
  const tokenField = useRef<HTMLInputElement>(null);
  const [query,setQuery] = useState('');
  const [draft,setDraft] = useState<typeof empty|null>(null);
  const [preview,setPreview] = useState(false);
  const [view,setView] = useState<View>('content');
  const [kind,setKind] = useState<Kind|''>('');
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey)||'null');
      if (saved && Object.hasOwn(kinds,saved.type) && typeof saved.title==='string') {
        setDraft({...empty,...saved,blocks:Array.isArray(saved.blocks)?saved.blocks:[]});
      }
    } catch {}
    const controller = new AbortController();
    fetch(sourceUrl,{cache:'no-store',signal:controller.signal}).then(async response => {
      if (!response.ok) throw new Error('GitHub source unavailable');
      const raw = await response.text();
      const latest:unknown = JSON.parse(raw);
      if (!latest || typeof latest !== 'object' || !('content' in latest) || !Array.isArray(latest.content)) {
        throw new Error('Invalid catalog');
      }
      if (!controller.signal.aborted) { source.current=raw; setCatalog({...latest,content:latest.content}); setReady(true); }
    }).catch(() => {
      if (!controller.signal.aborted) setStatus('فایل تازه از GitHub باز نشد. صفحه را دوباره بار کنید.');
    });
    return () => controller.abort();
  }, []);

  function field<K extends keyof typeof empty>(key:K,value:(typeof empty)[K]) {
    updateForm({...form,[key]:value,...(key==='type'?{parent:''}:{})});
  }
  function updateForm(next:typeof empty) {
    setForm(next);
    setDraft(next);
    try { localStorage.setItem(draftKey,JSON.stringify(next)); } catch {}
  }
  function openEditor(next:typeof empty) {
    setForm(next);
    setPreview(false);
    setView('editor');
    requestAnimationFrame(()=>document.getElementById('content-title')?.focus());
  }
  function edit(item:Item) {
    const meta = JSON.parse(item.meta || '{}');
    openEditor({id:item.id,type:item.type,title:item.title,summary:item.summary,body:item.body,parent:item.parent_id||'',category:item.category,video:meta.video||'',file:meta.file||'',blocks:Array.isArray(meta.blocks)?meta.blocks:[]});
    setStatus('');
  }
  function save(event:FormEvent) {
    event.preventDefault();
    if (!ready || publishing) return;
    const existing = catalog.content.find(item => item.id === form.id);
    const expected = parentKind[form.type];
    const parent = catalog.content.find(item => item.id === form.parent);
    if (!form.title.trim() || (expected && parent?.type !== expected)) {
      setStatus('عنوان و درس یا فصل مادر را تعیین کنید.');
      return;
    }
    const meta = JSON.parse(existing?.meta || '{}');
    let body: string;
    try {
      body = normalizeRich(form.body);
      meta.blocks = normalizeBlocks(form.blocks);
      if (meta.blocks.some((block:ContentBlock)=>block.url.startsWith('/api/files/'))) {
        throw new Error('برای بخش‌های درس، از پیوند HTTPS فایل بیرون از سایت استفاده کنید.');
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'متن یا بخش‌های درس معتبر نیست.');
      return;
    }
    meta.video = form.video.trim();
    meta.file = form.file.trim();
    const item: Item = {
      id: existing?.id || crypto.randomUUID(), type: form.type, title: form.title.trim(),
      summary: form.summary.trim(), body, parent_id: expected ? form.parent : null,
      category: form.category.trim(), status:'published', meta:JSON.stringify(meta),
    };
    const content = existing ? catalog.content.map(row => row.id===item.id ? item : row) : [...catalog.content,item];
    setCatalog({...catalog,content});
    edit(item);
    if (draft && draft.id===form.id) {
      setDraft(null);
      try { localStorage.removeItem(draftKey); } catch {}
    }
    setDirty(true);
    setStatus('محتوا آمادهٔ نشر است.');
    setView('publish');
  }
  const output = JSON.stringify(catalog,null,2)+'\n';
  async function publish(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dirty || publishing || !tokenField.current) return;
    const input = tokenField.current;
    const token = input.value.trim();
    input.value='';
    setPublishing(true);
    setStatus('در حال ثبت محتوا در GitHub…');
    try {
      await publishCatalog(token,source.current,output);
      source.current=output;
      setDirty(false);
      setView('content');
      setStatus('در GitHub ثبت شد. نسخهٔ عمومی پس از پایان ساخت خودکار به‌روز می‌شود.');
    } catch (error) {
      setStatus(error instanceof Error && !(error instanceof TypeError)?error.message:'ارتباط با GitHub برقرار نشد. محتوای آماده در پنل محفوظ است.');
    } finally {
      setPublishing(false);
    }
  }
  const expected = parentKind[form.type];
  const visible = catalog.content.filter(item=>(!kind||item.type===kind)&&item.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const media = catalog.content.flatMap(item=>{
    const meta = JSON.parse(item.meta || '{}');
    const links = [meta.video,meta.file,...(Array.isArray(meta.blocks)?meta.blocks.map((block:ContentBlock)=>block.url):[])];
    return [...new Set(links.filter((url):url is string=>typeof url==='string'&&url.startsWith('https://')))].map(url=>({item,url}));
  });
  function downloadBackup() {
    const url=URL.createObjectURL(new Blob([output],{type:'application/json'}));
    const link=document.createElement('a');
    link.href=url;
    link.download='isaqi-content-backup.json';
    link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <main className="public-admin" lang="fa" dir="rtl">
    <header className="public-admin-header"><div className="wrap">
      <a href={publicPageHref(base,'/','fa')}>بازگشت به سایت ←</a>
      <h1>میز کار آموزش</h1>
      <p>مدیریت محتوای آموزشی، پیش‌نمایش و نشر در GitHub</p>
    </div></header>
    <div className="wrap section public-admin-layout" aria-busy={publishing}>
      <nav className="panel public-admin-menu" aria-label="بخش‌های مدیریت">
        <button type="button" aria-current={view==='content'||view==='editor'?'true':undefined} onClick={()=>setView('content')}><BookOpen size={19}/>محتوای سایت</button>
        <button type="button" aria-current={view==='media'?'true':undefined} onClick={()=>setView('media')}><FileText size={19}/>فایل‌ها و ویدیو</button>
        <button type="button" aria-current={view==='languages'?'true':undefined} onClick={()=>setView('languages')}><Globe size={19}/>زبان‌ها و ترجمه</button>
        <button type="button" aria-current={view==='history'?'true':undefined} onClick={()=>setView('history')}><History size={19}/>تاریخچه و پشتیبان</button>
        {dirty&&<button type="button" aria-current={view==='publish'?'true':undefined} onClick={()=>setView('publish')}>نشر در GitHub</button>}
      </nav>
      <div className="public-admin-work">
      <section id="content-list" className="panel" hidden={view!=='content'}>
        <div className="public-admin-row">
          <h2>محتوا <small>({catalog.content.length.toLocaleString('fa-AF')})</small></h2>
          <button type="button" className="button dark" onClick={()=>openEditor(empty)}><Plus size={18}/>محتوای تازه</button>
        </div>
        {draft&&<div className="public-admin-draft">
          <strong>پیش‌نویس مرورگر</strong><span>{draft.title||'بدون عنوان'}</span>
          <button type="button" className="button light" onClick={()=>openEditor(draft)}>ادامهٔ ویرایش</button>
        </div>}
        <label className="public-admin-search"><span><Search size={17}/> جست‌وجوی عنوان</span>
          <input type="search" value={query} onChange={e=>setQuery(e.target.value)}/>
        </label>
        <label>نوع محتوا<select value={kind} onChange={e=>setKind(e.target.value as Kind|'')}>
          <option value="">همهٔ محتوا</option>
          {Object.entries(kinds).map(([value,label])=><option key={value} value={value}>{label}</option>)}
        </select></label>
        {visible.length===0?<p>{query?'عنوانی پیدا نشد.':'هنوز محتوایی ثبت نشده است.'}</p>:<ul className="public-admin-list">{visible.map(item=>
          <li key={item.id}><span><small>{kinds[item.type]}</small> {item.title}</span>
            <button type="button" className="button light" disabled={!ready} onClick={()=>edit(item)}><Pencil size={15}/>ویرایش</button>
          </li>
        )}</ul>}
      </section>
      <section className="panel" id="content-editor" hidden={view!=='editor'}>
        <div className="public-admin-row">
          <h2>{form.id?'ویرایش محتوا':'افزودن محتوا'}</h2>
          <button type="button" className="button light" onClick={()=>setView('content')}>بازگشت به فهرست</button>
        </div>
        <div className="public-admin-actions public-admin-editor-tabs" aria-label="نمای ویرایشگر">
          <button type="button" className={preview?'button light':'button dark'} aria-pressed={!preview} onClick={()=>setPreview(false)}>ویرایش</button>
          <button type="button" className={preview?'button dark':'button light'} aria-pressed={preview} onClick={()=>setPreview(true)}>پیش‌نمایش</button>
        </div>
        <form onSubmit={save} hidden={preview}>
          <label>نوع محتوا<select disabled={!!form.id} value={form.type} onChange={e=>field('type',e.target.value as Kind)}>
            {Object.entries(kinds).map(([value,label])=><option key={value} value={value}>{label}</option>)}
          </select></label>
          {expected&&<label>{kinds[expected]} مادر<select required value={form.parent} onChange={e=>field('parent',e.target.value)}>
            <option value="">انتخاب کنید</option>
            {catalog.content.filter(item=>item.type===expected).map(item=><option key={item.id} value={item.id}>{item.title}</option>)}
          </select></label>}
          <label>عنوان<input id="content-title" required maxLength={200} value={form.title} onChange={e=>field('title',e.target.value)}/></label>
          <label>معرفی کوتاه<input maxLength={1000} value={form.summary} onChange={e=>field('summary',e.target.value)}/></label>
          <label>دسته‌بندی<input maxLength={100} value={form.category} onChange={e=>field('category',e.target.value)}/></label>
          <RichTextEditor key={form.id||'new'} label="متن اصلی" value={form.body} onChange={value=>field('body',value)}/>
          <BlocksEditor value={form.blocks} onChange={value=>field('blocks',value)} files={[]} notify={setStatus} externalOnly/>
          <fieldset id="content-media"><legend>فایل‌ها و ویدیو</legend>
          <label>پیوند ویدیو (YouTube)<input type="url" dir="ltr" pattern="https://.+" value={form.video} onChange={e=>field('video',e.target.value)}/></label>
          <label>پیوند جزوه یا اسلاید (Google Drive)<input type="url" dir="ltr" pattern="https://.+" value={form.file} onChange={e=>field('file',e.target.value)}/></label>
          </fieldset>
          <div className="public-admin-actions">
            <button type="submit" className="button dark" disabled={!ready||publishing}>آماده‌کردن برای نشر</button>
            <button type="button" className="button light" onClick={()=>{updateForm(form);setStatus('پیش‌نویس برای ادامهٔ ویرایش در همین مرورگر ذخیره شد.')}}>ذخیرهٔ پیش‌نویس</button>
          </div>
        </form>
        {preview&&<article className="public-admin-draft public-admin-preview">
          <strong>پیش‌نمایش متن</strong>
          <h3>{form.title||'بدون عنوان'}</h3>
          {form.summary&&<p>{form.summary}</p>}
          {form.body&&<Text value={form.body}/>}
          <BlocksView blocks={form.blocks} renderText={value=><Text value={value}/>}/>
          <BlocksView blocks={[
            {id:'preview-video',type:'video',url:form.video,title:'ویدیوی درس',text:'',caption:'',alt:''},
            {id:'preview-file',type:'file',url:form.file,title:'جزوه یا اسلاید',text:'',caption:'',alt:''},
          ].filter(block=>block.url) as ContentBlock[]} renderText={value=><Text value={value}/>}/>
        </article>}
      </section>
      <p role="status">{status||(!ready?'در حال گرفتن آخرین نسخه از GitHub…':'')}</p>
      <section className="panel" hidden={view!=='publish'}>
        <h2>آماده‌سازی و نشر</h2>
        {dirty&&<section className="public-admin-publish">
          <h2>نشر در GitHub</h2>
          <form onSubmit={publish}>
            <label>کلید نشر GitHub<input ref={tokenField} type="password" required dir="ltr" autoComplete="off" spellCheck={false} disabled={publishing}/></label>
            <div className="public-admin-actions">
              <button type="submit" className="button dark" disabled={publishing}>{publishing?'در حال نشر…':'نشر در سایت'}</button>
              <button type="button" className="button light" onClick={downloadBackup}>دریافت پشتیبان</button>
            </div>
          </form>
          <details>
            <summary>ساخت کلید نشر</summary>
            <p>برای مخزن Physics-department یک کلید محدود با اجازهٔ <bdi>Contents: Read and write</bdi> بسازید. کلید فقط برای درخواست نشر به GitHub استفاده می‌شود.</p>
            <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">ساخت کلید در GitHub ↗</a>
          </details>
        </section>}
      </section>
      <section className="panel" hidden={view!=='media'}>
        <h2>فایل‌ها و ویدیوها</h2>
        {media.length===0?<p>هنوز پیوند رسانه‌ای ثبت نشده است.</p>:<ul className="public-admin-list">{media.map(({item,url})=>
          <li key={item.id+url}><a href={url} target="_blank" rel="noreferrer">{item.title} ↗</a>
            <button type="button" className="button light" disabled={!ready} onClick={()=>edit(item)}>ویرایش محتوا</button>
          </li>
        )}</ul>}
      </section>
      <section className="panel" id="content-languages" hidden={view!=='languages'}>
        <h2>زبان‌ها و ترجمه</h2>
        <div className="public-admin-actions">{[['fa','دری'],['ps','پښتو'],['en','English']].map(([code,label])=>
          <a className="button light" key={code} lang={code} href={editUrl.replace('content.json',code+'.json')} target="_blank" rel="noreferrer">{label} ↗</a>
        )}</div>
      </section>
      <section className="panel" hidden={view!=='history'}>
        <h2>تاریخچه و پشتیبان</h2>
        <div className="public-admin-actions">
          <a className="button light" href={historyUrl} target="_blank" rel="noreferrer"><History size={17}/>تاریخچهٔ نشر GitHub ↗</a>
          <button type="button" className="button dark" disabled={!ready} onClick={downloadBackup}><Download size={17}/>دریافت پشتیبان محتوا</button>
        </div>
      </section>
      </div>
    </div>
  </main>;
}
