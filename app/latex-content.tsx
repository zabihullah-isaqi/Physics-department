import {useMemo} from 'react';
import katex from 'katex';
import {MathFormula} from './math-formula';

function InlineText({source}:{source:string}) {
  const parts=useMemo(()=>source.split(/(\\\([^\n]+?\\\)|\$[^\n$]+\$|\\text(?:bf|it)\{[^{}]*\})/u),[source]);
  return <>{parts.map((part,index)=>{
    if (part.startsWith('\\textbf{')&&part.endsWith('}')) return <strong key={index}>{part.slice(8,-1)}</strong>;
    if (part.startsWith('\\textit{')&&part.endsWith('}')) return <em key={index}>{part.slice(8,-1)}</em>;
    if ((part.startsWith('\\(')&&part.endsWith('\\)'))||(part.startsWith('$')&&part.endsWith('$')&&part.length>1)) {
      try {
        const tex=part.startsWith('$')?part.slice(1,-1):part.slice(2,-2);
        const html=katex.renderToString(tex,{trust:false,throwOnError:true,maxExpand:500,maxSize:10,strict:'ignore'});
        return <span key={index} dir="ltr" dangerouslySetInnerHTML={{__html:html}}/>;
      } catch { return <code key={index}>{part}</code>; }
    }
    return <span key={index}>{part}</span>;
  })}</>;
}

const blocks=/(\\begin\{figure\}(?:\[[^\]]*\])?[\s\S]*?\\end\{figure\}|\\begin\{(?:itemize|enumerate)\}[\s\S]*?\\end\{(?:itemize|enumerate)\}|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\\(?:sub)?section\*?\{[^{}]*\}|\\includegraphics(?:\[[^\]]*\])?\{[^{}]*\})/u;

function figure(source:string,key:number) {
  const url=source.match(/\\includegraphics(?:\[[^\]]*\])?\{([^{}]*)\}/u)?.[1];
  const caption=source.match(/\\caption\{([^{}]*)\}/u)?.[1];
  try {
    const image=new URL(url||'');
    if (image.protocol==='https:'&&!image.username&&!image.password) {
      return <figure key={key}><img src={image.href} loading="lazy" alt={caption||'تصویر آموزشی'}/>{caption&&<figcaption><InlineText source={caption}/></figcaption>}</figure>;
    }
  } catch {}
  return <p key={key} className="muted">برای نمایش شکل، نشانی مستقیم HTTPS تصویر را در <bdi>\includegraphics</bdi> وارد کنید.</p>;
}

export function LatexContent({source}:{source:string}) {
  const body=source.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/u)?.[1]??source;
  return <div className="latex-content prose" dir="auto">{body.split(blocks).map((part,index)=>{
    const value=part.trim();
    if (!value) return null;
    if (/^\\begin\{figure\}|^\\includegraphics/u.test(value)) return figure(value,index);
    if (value.startsWith('\\[')&&value.endsWith('\\]')||value.startsWith('$$')&&value.endsWith('$$')) return <MathFormula key={index} tex={value} force/>;
    const heading=value.match(/^\\(subsection|section)\*?\{([^{}]*)\}$/u);
    if (heading) {
      const Heading=heading[1]==='section'?'h3':'h4';
      return <Heading key={index}><InlineText source={heading[2]}/></Heading>;
    }
    const list=value.match(/^\\begin\{(itemize|enumerate)\}([\s\S]*)\\end\{\1\}$/u);
    if (list) {
      const List=list[1]==='enumerate'?'ol':'ul';
      return <List key={index}>{list[2].split(/\\item\b/u).slice(1).map((item,i)=><li key={i}><InlineText source={item.trim()}/></li>)}</List>;
    }
    return value.split(/\n\s*\n/u).map((paragraph,i)=><p key={index+'-'+i}><InlineText source={paragraph.replace(/\s*\n\s*/gu,' ')}/></p>);
  })}</div>;
}
