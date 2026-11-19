import {env} from 'cloudflare:workers';
export function storage(){if(!env.BUCKET)throw Error('فضای فایل در دسترس نیست');return env.BUCKET}
export const storageKey=(file:any)=>file.storage_key||file.id;
export function videoKey(id:string,mime:string){return 'media/videos/'+id+'/source.'+(mime==='video/webm'?'webm':'mp4')}
