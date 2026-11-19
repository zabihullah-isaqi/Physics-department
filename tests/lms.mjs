import {createHash} from 'node:crypto';
import {Miniflare} from 'miniflare';
import {build} from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',d1Databases:['DB'],r2Buckets:['BUCKET'],cf:false});
try{
const DB=await mf.getD1Database('DB'),BUCKET=await mf.getR2Bucket('BUCKET');globalThis.__QA_ENV__={DB,BUCKET};
for(const file of (await fs.readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort()){const migration=await fs.readFile('drizzle/'+file,'utf8');for(const sql of migration.split('--> statement-breakpoint'))if(sql.trim())await DB.prepare(sql).run()}
await DB.prepare("INSERT INTO settings(id,value) VALUES('catalog_v1_initialized','1')").run();
await fs.mkdir('.sites-runtime/qa',{recursive:true});
const modules={};for(const name of ['data','admin','files','backup','slides','slidePublic','fileDownload','drafts','history','translations','auth','people','learning','media','site-config','media-manifest']){const outfile=path.resolve('.sites-runtime/qa/'+name+'.mjs');await build({entryPoints:[name==='slidePublic'?'app/api/slides/[id]/route.ts':name==='fileDownload'?'app/api/files/[id]/route.ts':'app/api/'+name+'/route.ts'],outfile,bundle:true,format:'esm',platform:'node',logLevel:'silent',plugins:[{name:'test-runtime',setup(b){b.onResolve({filter:/^(cloudflare:workers|next\/headers|next\/navigation)$/},a=>({path:a.path,namespace:'qa'}));b.onLoad({filter:/.*/,namespace:'qa'},a=>({contents:a.path==='cloudflare:workers'?'export const env=globalThis.__QA_ENV__;':a.path==='next/headers'?'export async function headers(){return globalThis.__QA_HEADERS__}':'export function redirect(url){throw Error(url)}'}))}}]});modules[name]=await import(outfile)}
async function call(name,body=null,user=null,query='',cookie=''){const h=new Headers({origin:'https://site.test'});if(user){h.set('oai-authenticated-user-id',user);h.set('oai-authenticated-user-email',user==='owner'?'zabihullah68@gmail.com':user+'@example.test')}if(cookie)h.set('cookie',cookie);globalThis.__QA_HEADERS__=h;const req=new Request('https://site.test/api/'+name+query,{method:body?'POST':'GET',headers:h,...(body?{body:JSON.stringify(body)}:{})});const r=body?await modules[name].POST(req):await modules[name].GET(req);let data;try{data=await r.json()}catch{data=null}return {status:r.status,data,cookie:r.headers.get('set-cookie')?.split(';')[0]}}
const password='qa-educational-secret-12345';
assert.equal((await call('auth',{action:'register',email:'zabihullah68@gmail.com',password,name:'Owner',profileType:'teacher'})).status,400);
let account=await call('auth',{action:'register',email:'teacher@example.test',password,name:'Teacher',profileType:'teacher',role:'admin'});assert.equal(account.status,200);const teacherCookie=account.cookie;
assert.equal((await call('auth',null,null,'',teacherCookie)).data.user.teacher,false);assert.equal((await call('admin',null,null,'',teacherCookie)).status,403);
assert.equal((await call('auth',{action:'login',email:'teacher@example.test',password:'wrong'})).status,401);
assert.equal((await call('auth',{action:'login',email:'teacher@example.test',password})).status,200);
assert.equal((await call('people',{action:'apply',bio:'A long educational introduction explaining my teaching experience.',subjects:'Physics'},null,'',teacherCookie)).status,200);
let users=await call('people',null,'owner'),app=users.data.applications[0],teacherId=app.user_id;assert.equal((await call('people',{action:'review-application',id:app.id,status:'approved'},'owner')).status,200);assert.equal((await call('auth',null,null,'',teacherCookie)).data.user.teacher,true);
const save=async(content,cookie=teacherCookie,user=null)=>call('admin',{action:'save',content},user,'',cookie);
const course=(await save({type:'course',title:'Sequential',status:'published',meta:{learningMode:'sequential'}})).data.id;assert(course);assert.equal((await DB.prepare('SELECT status FROM content WHERE id=?').bind(course).first()).status,'draft');
assert.equal((await call('people',{action:'review-content',id:course,status:'approved'},'owner')).status,200);
const chapter=(await save({type:'chapter',title:'Chapter',status:'published',parent_id:course})).data.id;await call('people',{action:'review-content',id:chapter,status:'approved'},'owner');
const lesson=(await save({type:'lesson',title:'First',status:'published',parent_id:chapter,body:'PRIVATE_FIRST',meta:{order:1}})).data.id;await call('people',{action:'review-content',id:lesson,status:'approved'},'owner');
const second=(await save({type:'lesson',title:'Second',status:'published',parent_id:chapter,body:'PRIVATE_SECOND',meta:{order:2}})).data.id;await call('people',{action:'review-content',id:second,status:'approved'},'owner');
assert.equal((await save({id:lesson,type:'lesson',title:'Stolen',status:'published',parent_id:chapter},'', 'other')).status,403);
assert.equal((await call('data')).data.content.find(c=>c.id===second).body,'');
assert.equal((await call('learning',null,null,'?lessonId='+second)).status,403);
account=await call('auth',{action:'register',email:'learner@example.test',password,name:'Learner',profileType:'university'});assert.equal(account.status,200);const learnerCookie=account.cookie;
const learnerId=(await call('auth',null,null,'',learnerCookie)).data.user.id;
assert.equal((await call('learning',{action:'enroll',courseId:course},null,'',learnerCookie)).status,200);
assert.equal((await call('learning',null,null,'?lessonId='+lesson,learnerCookie)).status,200);
const question={id:'q1',type:'number',prompt:'Two plus two?',points:1,options:[],correct:4,tolerance:0.1,units:['m'],explanation:'Four metres'};
assert.equal((await call('learning',{action:'save-assessment',lessonId:lesson,assessment:{title:'Homework',kind:'homework',status:'published',required:true,passPercent:80,attemptLimit:3,questions:[question]}},null,'',learnerCookie)).status,403);
let a=await call('learning',{action:'save-assessment',lessonId:lesson,assessment:{title:'Homework',kind:'homework',status:'published',required:true,passPercent:80,attemptLimit:3,questions:[question]}},null,'',teacherCookie);assert.equal(a.status,200);const assessmentId=a.data.id;
let dto=(await call('learning',null,null,'?lessonId='+lesson,learnerCookie)).data;assert.equal(dto.assessments[0].questions[0].correct,undefined);assert.equal(dto.assessments[0].questions[0].tolerance,undefined);
await call('learning',{action:'read',lessonId:lesson},null,'',learnerCookie);assert.equal((await call('learning',{action:'complete',lessonId:lesson},null,'',learnerCookie)).status,400);
assert.equal((await call('learning',{action:'submit',lessonId:lesson,assessmentId,revision:99,answers:{}},null,'',learnerCookie)).status,409);
let result=await call('learning',{action:'submit',lessonId:lesson,assessmentId,revision:1,answers:{q1:{value:'4',unit:'s'}}},null,'',learnerCookie);assert.equal(result.data.passed,false);
result=await call('learning',{action:'submit',lessonId:lesson,assessmentId,revision:1,answers:{q1:{value:'۴٫۰۵',unit:'m'}}},null,'',learnerCookie);assert.equal(result.data.passed,true);
assert.equal((await call('learning',{action:'complete',lessonId:lesson},null,'',learnerCookie)).status,200);assert.equal((await call('learning',null,null,'?lessonId='+second,learnerCookie)).status,200);
assert.equal((await call('learning',{action:'question',lessonId:lesson,body:'How is this formula derived?'},null,'',learnerCookie)).status,200);
const config={primary:'#123456',accent:'#abcdef',overrides:{'خانه':'خانهٔ آموزش'},pages:[{id:'help',title:'Help',body:'Guide',published:true}]};assert.equal((await call('site-config',{config,revision:0},null,'',learnerCookie)).status,403);assert.equal((await call('site-config',{config,revision:0},'owner')).status,200);assert.equal((await call('site-config',{config,revision:0},'owner')).status,409);assert.equal((await call('site-config',null,'owner')).data.versions.length,1);
// Actual multipart R2 completion, private file access, per-teacher ownership and range reads.
let upload=await call('media',{action:'start',name:'lesson.mp4',mime:'video/mp4',size:12,fingerprint:'a'.repeat(64),lessonId:second},null,'',teacherCookie);assert.equal(upload.status,200);const id=upload.data.id;
assert.equal((await call('media',null,null,'?id='+id,learnerCookie)).status,403);
globalThis.__QA_HEADERS__=new Headers({cookie:teacherCookie});let part=await modules.media.PUT(new Request('https://site.test/api/media?id='+id+'&part=1',{method:'PUT',headers:{origin:'https://site.test',cookie:teacherCookie},body:'video-bytes!'}));assert.equal(part.status,200);
assert.equal((await call('media',null,null,'?id='+id,teacherCookie)).data.parts.length,1);assert.equal((await call('media',{action:'finish',id},null,'',teacherCookie)).status,200);
// Set video condition and prove repeat playback does not count twice.
let row=await DB.prepare('SELECT * FROM content WHERE id=?').bind(second).first();assert.equal((await save({...row,meta:{order:2,video:'/api/files/'+id,videoDuration:30,requireVideo:true,requireRead:true}},'', 'owner')).status,200);
await call('learning',{action:'read',lessonId:second},null,'',learnerCookie);
await DB.prepare('UPDATE lesson_progress SET last_ping=?,position=0 WHERE id=?').bind(new Date(Date.now()-15000).toISOString(),learnerId+':'+second).run();await call('learning',{action:'ping',lessonId:second,position:15,elapsed:15,playing:true},null,'',learnerCookie);
await DB.prepare('UPDATE lesson_progress SET last_ping=?,position=0 WHERE id=?').bind(new Date(Date.now()-15000).toISOString(),learnerId+':'+second).run();await call('learning',{action:'ping',lessonId:second,position:15,elapsed:15,playing:true},null,'',learnerCookie);
assert.equal((await DB.prepare('SELECT watched FROM lesson_progress WHERE id=?').bind(learnerId+':'+second).first()).watched,15);assert.equal((await call('learning',{action:'complete',lessonId:second},null,'',learnerCookie)).status,400);
await DB.prepare('UPDATE lesson_progress SET last_ping=?,position=15 WHERE id=?').bind(new Date(Date.now()-15000).toISOString(),learnerId+':'+second).run();assert.equal((await call('learning',{action:'ping',lessonId:second,position:30,elapsed:15,playing:true},null,'',learnerCookie)).data.complete,true);
globalThis.__QA_HEADERS__=new Headers();assert.equal((await modules.fileDownload.GET(new Request('https://site.test/api/files/'+id),{params:Promise.resolve({id})})).status,403);
globalThis.__QA_HEADERS__=new Headers({cookie:learnerCookie});assert.equal((await modules.fileDownload.GET(new Request('https://site.test/api/files/'+id,{headers:{range:'bytes=0-3'}}),{params:Promise.resolve({id})})).status,206);
assert.equal((await call('media-manifest',null,'owner')).status,200);
// Another instructor cannot edit content, drafts, translations, slides or reference private files.
await call('data',{action:'join',name:'Other'},'other');await DB.prepare("INSERT INTO accounts(id,email,name,role,created) VALUES('other','other@example.test','Other','teacher',?)").bind(new Date().toISOString()).run();
assert.equal((await save({...row,title:'Stolen',meta:{}},'','other')).status,403);
assert.equal((await call('drafts',null,'other','?targetId='+second)).status,403);
assert.equal((await call('translations',null,'other','?targetId='+second+'&lang=en')).status,403);
assert.equal((await call('slides',null,'other','?chapterId='+chapter)).status,403);
assert.equal((await save({type:'article',title:'Stolen video',status:'published',meta:{video:'/api/files/'+id}},'','other')).status,403);
// Pending published edits preserve the live course, then replace it only after owner approval.
let courseRow=await DB.prepare('SELECT * FROM content WHERE id=?').bind(course).first();assert.equal((await save({...courseRow,title:'Proposed revision',meta:JSON.parse(courseRow.meta)})).status,200);assert.equal((await DB.prepare('SELECT title FROM content WHERE id=?').bind(course).first()).title,'Sequential');assert.equal((await call('people',null,'owner')).data.proposals.length,1);await call('people',{action:'review-content',id:course,status:'approved'},'owner');assert.equal((await DB.prepare('SELECT title FROM content WHERE id=?').bind(course).first()).title,'Proposed revision');
// Every supported grading type has a deterministic answer key, including Persian normalization.
const modelPath=path.resolve('.sites-runtime/qa/assessment-model.mjs');await build({entryPoints:['app/assessment-model.ts'],outfile:modelPath,bundle:true,format:'esm',platform:'node',logLevel:'silent'});const model=await import(modelPath);
const opts=[{id:'a',text:'Alpha'},{id:'b',text:'Beta'}],qs=model.normalizeQuestions([{id:'single',type:'single',prompt:'S',correct:'b',options:opts},{id:'multiple',type:'multiple',prompt:'M',correct:['a','b'],options:opts},{id:'boolean',type:'boolean',prompt:'B',correct:false},{id:'short',type:'short',prompt:'Text',correct:['فیزیک']},{id:'number',type:'number',prompt:'N',correct:10,tolerance:0.1,units:['m']},{id:'ordering',type:'ordering',prompt:'O',correct:['b','a'],options:opts},{id:'matching',type:'matching',prompt:'Match',correct:{a:'one',b:'two'},options:opts}]);assert.equal(model.grade(qs,{single:'b',multiple:['b','a'],boolean:false,short:' فيزيك ',number:{value:'۱۰٫۰۵',unit:'m'},ordering:['b','a'],matching:{a:'one',b:'two'}}).score,100);assert(model.publicQuestions(qs).every(q=>!('correct' in q)&&!('explanation' in q)));
assert.equal((await call('people',{action:'access',id:teacherId,role:'teacher',status:'suspended',canPublish:false},'owner')).status,200);assert.equal((await call('auth',null,null,'',teacherCookie)).data.user,null);
console.log('PASS: independent accounts, role approvals, instructor isolation, publication review, sequential enrollment, protected answers/media, automatic grading, video coverage, resumable multipart upload, CMS history/conflicts and suspension.');
}finally{await mf.dispose()}
