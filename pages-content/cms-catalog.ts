import {safeBlockURL, youtubeEmbed} from '../app/content-blocks-model';

type Entry = {
  id: string; title: string; parent?: string; summary?: string; body?: string;
  formula?: string; video?: string; file?: string;
};
const groups = {courses:'course',chapters:'chapter',lessons:'lesson'} as const;

export function cmsCatalogue() {
  const files = import.meta.glob('./cms/*/*.json',{eager:true,import:'default'}) as unknown as Record<string,Entry>;
  const paths = new Map(Object.entries(files).map(([path,entry])=>['pages-content'+path.slice(1),entry]));
  const ids = new Set<string>();
  return Object.entries(files).map(([path,entry])=>{
    const collection=path.split('/')[2] as keyof typeof groups;
    const type=groups[collection];
    if (!type || !/^[a-z0-9-]+$/.test(entry.id) || ids.has(entry.id) || !entry.title?.trim()) {
      throw new Error('Invalid or duplicate CMS content: '+path);
    }
    ids.add(entry.id);
    const parentPrefix=type==='chapter'?'pages-content/cms/courses/':'pages-content/cms/chapters/';
    const parent=entry.parent && entry.parent.startsWith(parentPrefix) ? paths.get(entry.parent) : undefined;
    if (type!=='course' && !parent) throw new Error('Missing CMS parent: '+path);
    const video=entry.video?.trim()||'';
    const file=entry.file?.trim()||'';
    if (video && !youtubeEmbed(video)) throw new Error('Invalid YouTube link: '+path);
    if (file && (!file.startsWith('https://') || !safeBlockURL(file))) throw new Error('Invalid file link: '+path);
    const blocks=entry.formula?.trim() ? [{
      id:entry.id+'-formula',type:'formula',title:'',text:entry.formula,url:'',caption:'',alt:'',
    }] : [];
    return {
      id:entry.id,title:entry.title,type,parent_id:parent?.id||null,status:'published',
      summary:entry.summary||'',body:entry.body||'',category:'',
      meta:JSON.stringify({video,file,blocks,sourceLanguage:'fa'}),
    };
  });
}
