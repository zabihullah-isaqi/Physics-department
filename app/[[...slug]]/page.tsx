import Portal from '../portal';
import {GET} from '../api/data/route';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{slug?:string[]}>}){const {slug}=await params;const r=await GET();const data:any=await r.json();return <Portal initialData={r.ok?data:null} initialPath={'/'+(slug||[]).join('/')}/>}
