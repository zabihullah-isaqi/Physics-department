import {env} from 'cloudflare:workers';
import {getChatGPTUser} from './chatgpt-auth';
import {localAccount} from './account-auth';
export const OWNER_EMAIL='zabihullah68@gmail.com';
export const db=()=>{if(!env.DB)throw new Error('پایگاه داده در دسترس نیست');return env.DB};
export type SiteUser={id:string;name:string;email:string;admin:boolean;teacher:boolean;role:string;profileType:string;canPublish:boolean;emailVerified:boolean;provider:string};
export async function identity():Promise<SiteUser|null>{const u=await getChatGPTUser();if(u?.email.toLowerCase()===OWNER_EMAIL)return {id:u.userId,name:u.fullName||u.email,email:u.email,admin:true,teacher:true,role:'admin',profileType:'teacher',canPublish:true,emailVerified:true,provider:'chatgpt'};const a=await localAccount();if(a)return {id:a.id,name:a.name,email:a.email,admin:false,teacher:a.role==='teacher',role:a.role,profileType:a.profile_type,canPublish:!!a.can_publish,emailVerified:!!a.email_verified,provider:'email'};if(!u)return null;const account:any=await db().prepare('SELECT * FROM accounts WHERE id=?').bind(u.userId).first();if(account?.status==='suspended')return null;return {id:u.userId,name:account?.name||u.fullName||u.email,email:u.email,admin:false,teacher:account?.role==='teacher',role:account?.role||'learner',profileType:account?.profile_type||'student',canPublish:!!account?.can_publish,emailVerified:true,provider:'chatgpt'}}
export async function canEditContent(u:SiteUser|null,id:string){if(!u)return false;if(u.admin)return true;if(!u.teacher)return false;const row:any=await db().prepare('SELECT owner_id FROM content WHERE id=?').bind(id).first();return row?.owner_id===u.id}
export function sameOrigin(r:Request){const o=r.headers.get('origin');return !!o&&o===new URL(r.url).origin}
export function json(v:unknown,status=200){return Response.json(v,{status,headers:{'Cache-Control':'no-store'}})}
export function safeURL(s:unknown){if(typeof s!=='string')return '';if(/^\/api\/files\/[\w-]+(?:\?inline=1)?$/.test(s))return s;try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password?s:''}catch{return ''}}
export function parseMeta(s:string){try{return JSON.parse(s)}catch{return {}}}
