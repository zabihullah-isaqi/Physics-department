import {useState} from 'react';

const topics = ['حرکت و نیرو','قانون‌های نیوتن','جاذبه و سقوط آزاد','کار و انرژی','حرکت پرتابی','موج و صوت','برق و مدار','مغناطیس','گرما و ترمودینامیک','نور و اپتیک'];

export function HomeMetrics({items, language}:{
  items: {type:string;status:string}[]; language:string;
}) {
  const [paused,setPaused] = useState(false);
  const format = new Intl.NumberFormat(language==='en'?'en':language==='ps'?'ps-AF':'fa-AF');
  const published = items.filter(item=>item.status==='published');
  const labels = language==='en' ? ['Courses','Lessons','Experiments','Resources','Pause','Play']
    : language==='ps' ? ['کورسونه','درسونه','تجربې','سرچینې','درول','چالانول']
    : ['درس منتشرشده','جلسهٔ آموزشی','آزمایش لابراتوار','منبع آموزشی','توقف نوار','حرکت نوار'];
  return <section data-home-section="stats" className="home-metrics">
    <dl className="wrap home-metric-grid">
      {['course','lesson','lab','resource'].map((type,index)=><div key={type}>
        <dt>{labels[index]}</dt>
        <dd>{format.format(published.filter(item=>item.type===type).length)}</dd>
      </div>)}
    </dl>
    <div className="home-topic-band" lang="fa" data-paused={paused}>
      <div className="home-topic-window">
        <div className="home-topic-track">
          {[0,1].map(copy=><ul key={copy} dir="rtl" aria-hidden={copy===1||undefined}>
            {topics.map(topic=><li key={topic}>{topic}</li>)}
          </ul>)}
        </div>
      </div>
      <button type="button" onClick={()=>setPaused(!paused)} lang={language}>{labels[paused?5:4]}</button>
    </div>
  </section>;
}
