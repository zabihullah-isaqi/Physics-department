const endpoint = 'https://api.github.com/repos/zabihullah-isaqi/Physics-department/contents/pages-content/content.json';

export async function publishCatalog(token: string, original: string, next: string) {
  if (!/^github_pat_[a-zA-Z0-9_]+$/.test(token)) {
    throw new Error('کلید دسترسی محدود GitHub را وارد کنید.');
  }
  const headers = {Authorization:'Bearer '+token,Accept:'application/vnd.github+json'};
  const options = {headers,cache:'no-store' as const,redirect:'error' as const};
  const current = await fetch(endpoint+'?ref=main',options);
  if (!current.ok) throw new Error('GitHub فایل محتوا را باز نکرد. دسترسی کلید را بررسی کنید.');
  const file = await current.json() as {sha?:string;content?:string;encoding?:string};
  if (!file.sha || !file.content || file.encoding!=='base64') throw new Error('نسخهٔ فعلی فایل قابل بررسی نیست.');
  const bytes = Uint8Array.from(atob(file.content),character=>character.charCodeAt(0));
  const latest = new TextDecoder().decode(bytes);
  if (latest===next) return;
  if (latest!==original) {
    throw new Error('فایل محتوا در GitHub تغییر کرده است. کار آماده را پشتیبان بگیرید و پیش از نشر با نسخهٔ تازه یکجا کنید.');
  }
  const encoded = new TextEncoder().encode(next);
  let binary='';
  for (let index=0;index<encoded.length;index+=8192) {
    binary+=String.fromCharCode(...encoded.subarray(index,index+8192));
  }
  const response = await fetch(endpoint,{
    ...options,method:'PUT',headers:{...headers,'Content-Type':'application/json'},
    body:JSON.stringify({message:'Publish educational content from the admin panel',content:btoa(binary),sha:file.sha,branch:'main'}),
  });
  if (response.status===409) throw new Error('GitHub تغییر هم‌زمانی را تشخیص داد. محتوای آمادهٔ شما در پنل محفوظ است.');
  if (!response.ok) throw new Error('ثبت محتوا در GitHub ممکن نشد. اجازهٔ نوشتن کلید و تنظیمات شاخهٔ اصلی را بررسی کنید.');
}
