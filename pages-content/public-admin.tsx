import {useEffect, useState, type FormEvent} from 'react';
import {publicPageHref} from '../app/public-path';

const editUrl = 'https://github.com/zabihullah-isaqi/Physics-department/edit/main/pages-content/content.json';
const sourceUrl = 'https://raw.githubusercontent.com/zabihullah-isaqi/Physics-department/main/pages-content/content.json';
const kinds = {course:'درس',chapter:'فصل',lesson:'جلسه',lab:'آزمایش',article:'نوشته',research:'اثر پژوهشی',resource:'منبع'};
type Kind = keyof typeof kinds;
type Item = {
  id: string; type: Kind; title: string; summary: string; body: string;
  parent_id: string | null; category: string; status: 'published'; meta: string;
};
type Catalog = {content: Item[]; [key: string]: unknown};
const empty = {id:'',type:'course' as Kind,title:'',summary:'',body:'',parent:'',category:'',video:'',file:''};
const parentKind: Partial<Record<Kind, Kind>> = {chapter:'course',lesson:'chapter'};

export function PublicAdmin({initial,base}:{initial:Catalog;base:string}) {
  const [catalog,setCatalog] = useState(initial);
  const [form,setForm] = useState(empty);
  const [status,setStatus] = useState('');
  const [ready,setReady] = useState(false);
  const [dirty,setDirty] = useState(false);
  const [copied,setCopied] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(sourceUrl,{cache:'no-store',signal:controller.signal}).then(async response => {
      if (!response.ok) throw new Error('GitHub source unavailable');
      const latest = await response.json();
      if (!latest || typeof latest !== 'object' || !('content' in latest) || !Array.isArray(latest.content)) {
        throw new Error('Invalid catalog');
      }
      if (!controller.signal.aborted) { setCatalog({...latest,content:latest.content}); setReady(true); }
    }).catch(() => {
      if (!controller.signal.aborted) setStatus('فایل تازه از GitHub باز نشد. صفحه را دوباره بار کنید.');
    });
    return () => controller.abort();
  }, []);

  function field<K extends keyof typeof empty>(key:K,value:(typeof empty)[K]) {
    setForm(previous => ({...previous,[key]:value}));
  }
  function edit(item:Item) {
    const meta = JSON.parse(item.meta || '{}');
    setForm({id:item.id,type:item.type,title:item.title,summary:item.summary,body:item.body,parent:item.parent_id||'',category:item.category,video:meta.video||'',file:meta.file||''});
    setStatus('');
  }
  function save(event:FormEvent) {
    event.preventDefault();
    if (!ready) return;
    const existing = catalog.content.find(item => item.id === form.id);
    const expected = parentKind[form.type];
    const parent = catalog.content.find(item => item.id === form.parent);
    if (!form.title.trim() || (expected && parent?.type !== expected)) {
      setStatus('عنوان و درس یا فصل مادر را تعیین کنید.');
      return;
    }
    const meta = JSON.parse(existing?.meta || '{}');
    meta.video = form.video.trim();
    meta.file = form.file.trim();
    const item: Item = {
      id: existing?.id || crypto.randomUUID(), type: form.type, title: form.title.trim(),
      summary: form.summary.trim(), body: form.body, parent_id: expected ? form.parent : null,
      category: form.category.trim(), status:'published', meta:JSON.stringify(meta),
    };
    const content = existing ? catalog.content.map(row => row.id===item.id ? item : row) : [...catalog.content,item];
    setCatalog({...catalog,content});
    edit(item);
    setDirty(true);
    setCopied(false);
    setStatus('در فهرست آمادهٔ نشر شد. برای ثبت نهایی، فایل را به GitHub بفرستید.');
  }
  const output = JSON.stringify(catalog,null,2)+'\n';
  const expected = parentKind[form.type];
  return <main className="wrap section public-admin" lang="fa" dir="rtl">
    <a href={publicPageHref(base,'/','fa')}>← بازگشت به سایت</a>
    <h1>مدیریت محتوای آموزشی</h1>
    <p>درس، فصل یا جلسه را اینجا آماده کنید. نشر نهایی به حساب GitHub دارای اجازهٔ ویرایش نیاز دارد.</p>
    <div className="public-admin-layout">
      <section className="panel">
        <h2>{form.id?'ویرایش محتوا':'افزودن محتوا'}</h2>
        <form onSubmit={save}>
          <label>نوع محتوا<select disabled={!!form.id} value={form.type} onChange={e=>setForm({...form,type:e.target.value as Kind,parent:''})}>
            {Object.entries(kinds).map(([value,label])=><option key={value} value={value}>{label}</option>)}
          </select></label>
          {expected&&<label>{kinds[expected]} مادر<select required value={form.parent} onChange={e=>field('parent',e.target.value)}>
            <option value="">انتخاب کنید</option>
            {catalog.content.filter(item=>item.type===expected).map(item=><option key={item.id} value={item.id}>{item.title}</option>)}
          </select></label>}
          <label>عنوان<input required maxLength={200} value={form.title} onChange={e=>field('title',e.target.value)}/></label>
          <label>معرفی کوتاه<input maxLength={1000} value={form.summary} onChange={e=>field('summary',e.target.value)}/></label>
          <label>دسته‌بندی<input maxLength={100} value={form.category} onChange={e=>field('category',e.target.value)}/></label>
          <label>متن اصلی<textarea rows={8} value={form.body} onChange={e=>field('body',e.target.value)}/></label>
          <label>پیوند ویدیو (YouTube)<input type="url" dir="ltr" pattern="https://.+" value={form.video} onChange={e=>field('video',e.target.value)}/></label>
          <label>پیوند جزوه یا اسلاید (Google Drive)<input type="url" dir="ltr" pattern="https://.+" value={form.file} onChange={e=>field('file',e.target.value)}/></label>
          <div className="public-admin-actions">
            <button type="submit" className="button dark" disabled={!ready}>آماده‌کردن برای نشر</button>
            {form.id&&<button type="button" className="button light" onClick={()=>setForm(empty)}>محتوای تازه</button>}
          </div>
        </form>
      </section>
      <section className="panel">
        <h2>فهرست محتوا</h2>
        {catalog.content.length===0?<p>فهرست فعلاً خالی است.</p>:<ul>{catalog.content.map(item=>
          <li key={item.id}><button type="button" className="text-link" disabled={!ready} onClick={()=>edit(item)}>{kinds[item.type]} · {item.title}</button></li>
        )}</ul>}
        <p role="status">{status||(!ready?'در حال گرفتن آخرین نسخه از GitHub…':'آخرین نسخه از GitHub گرفته شد.')}</p>
        {dirty&&<section className="public-admin-publish">
          <h2>نشر در GitHub</h2>
          <ol>
            <li>فایل آماده را کاپی کنید.</li>
            <li>ویرایشگر GitHub را باز کنید، همهٔ متن قبلی را انتخاب و با متن کاپی‌شده جایگزین کنید.</li>
            <li>روی <bdi>Commit changes</bdi> بزنید. پس از تأیید، GitHub سایت را به‌روز می‌کند.</li>
          </ol>
          <div className="public-admin-actions">
            <button type="button" className="button dark" onClick={async()=>{
              try { await navigator.clipboard.writeText(output); setCopied(true); }
              catch { setStatus('کاپی خودکار ممکن نشد. فایل آماده را از گزینهٔ پایین کاپی کنید.'); }
            }}>{copied?'کاپی شد':'کاپی فایل آماده'}</button>
            <a className="button light" href={editUrl} target="_blank" rel="noreferrer">باز کردن ویرایشگر GitHub ↗</a>
          </div>
          <details><summary>دیدن فایل آماده</summary><textarea readOnly dir="ltr" rows={7} aria-label="فایل آمادهٔ نشر" value={output} onFocus={e=>e.target.select()}/></details>
        </section>}
      </section>
    </div>
  </main>;
}
