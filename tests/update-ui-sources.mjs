import ts from 'typescript';
import fs from 'node:fs';
const result=new Set();
for(const [name,end] of [['portfolio.tsx',null],['home.tsx',null],['portal.tsx','function Admin('],['slides.tsx','export function SlideDeckEditor'],['content-blocks.tsx','export function BlocksEditor'],['auth-ui.tsx',null],['people-ui.tsx','export function PeopleAdmin'],['learning-ui.tsx',null]]){
 const source=fs.readFileSync('app/'+name,'utf8').split(end||'\0')[0];const ast=ts.createSourceFile(name,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 function walk(n){if(ts.isStringLiteral(n)||ts.isJsxText(n)||ts.isNoSubstitutionTemplateLiteral(n)){const text=n.text.trim();if(/[\u0600-\u06ff]/.test(text)&&text.length<10000)result.add(text)}ts.forEachChild(n,walk)}walk(ast)
}
fs.writeFileSync('app/ui-source.json',JSON.stringify([...result].sort(),null,2));
console.log('Updated '+result.size+' interface source strings.');
