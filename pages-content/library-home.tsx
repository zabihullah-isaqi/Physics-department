import {ArrowLeft, Atom, BookOpen, ChevronLeft, FlaskConical, Search} from 'lucide-react';
import {useLocale} from '../app/i18n';

type Course = {id:string;type:string;title:string;category?:string;status:string};
const relativityId = 'f94b5159-7714-4cf5-bff7-11b05992b8e8';
const relativityArt = import.meta.env.BASE_URL+'relativity.webp';
const copy = {
  fa: {
    title:'درس‌های فزیک را پیدا کنید', intro:'درس‌ها را بر اساس موضوع پیدا کنید و مفهوم‌ها را با مطالعه و آزمایش دنبال کنید.',
    search:'جست‌وجوی درس یا موضوع', topics:'موضوع‌های اصلی فزیک', all:'همهٔ درس‌ها', labs:'لابراتوار',
    featured:'درس برگزیده', open:'مطالعهٔ درس', relativity:'آشنایی با زمان، فضا و گرانش در نظریهٔ نسبیت.',
    image:'نمای مفهومی خمیدگی فضا‌ـ‌زمان', empty:'موضوع‌ها پس از نشر درس‌ها در اینجا ظاهر می‌شوند.',
  },
  ps: {
    title:'د فزیک درسونه ومومئ', intro:'درسونه د موضوع له مخې ومومئ او مفاهیم په لوست او تجربې سره وپېژنئ.',
    search:'د درس یا موضوع لټون', topics:'د فزیک اصلي موضوعات', all:'ټول درسونه', labs:'لابراتوار',
    featured:'غوره شوی درس', open:'درس ولولئ', relativity:'د نسبیت په نظریه کې د وخت، فضا او جاذبې پېژندنه.',
    image:'د فضا او وخت د انحنا انځور', empty:'د درسونو له خپرېدو وروسته به موضوعات دلته ښکاره شي.',
  },
  en: {
    title:'Find your physics lessons', intro:'Find lessons by topic and explore the concepts through reading and experiments.',
    search:'Search lessons or topics', topics:'Physics topics', all:'All lessons', labs:'Laboratory',
    featured:'Featured lesson', open:'Read the lesson', relativity:'Explore time, space, and gravity through relativity.',
    image:'Conceptual illustration of spacetime curvature', empty:'Topics will appear here as lessons are published.',
  },
};

export function LibraryHome({items}:{items:Course[]}) {
  const {language,href}=useLocale();
  const labels=copy[language as keyof typeof copy]||copy.fa;
  const link=href||((path:string)=>path);
  const courses=items.filter(item=>item.type==='course'&&item.status==='published');
  const featured=courses.find(course=>course.id===relativityId)||courses[0];
  const isRelativity=featured?.id===relativityId;
  const topics=[...new Set(courses.map(course=>course.category?.trim()).filter((category):category is string=>!!category))];
  return <section className="library-hero" data-home-section="hero">
    <div className="wrap library-hero-grid" data-featured={!!featured}>
      <div className="library-search-area">
        <h1>{labels.title}</h1>
        <p className="library-intro">{labels.intro}</p>
        <form className="library-search" action={link('/courses')} method="get" role="search">
          <input type="search" name="q" aria-label={labels.search} placeholder={labels.search}/>
          <button type="submit" aria-label={labels.search}><Search size={22}/></button>
        </form>
        <div className="library-topics">
          <h2>{labels.topics}</h2>
          {topics.length?<ul>{topics.map(topic=><li key={topic}>
            <a href={link('/courses?q='+encodeURIComponent(topic))}><Atom size={19}/><span>{topic}</span><ChevronLeft size={16}/></a>
          </li>)}</ul>:<p className="muted">{labels.empty}</p>}
        </div>
        <div className="library-actions">
          <a className="academy-button primary" href={link('/courses')}>{labels.all}<ArrowLeft size={18}/></a>
          <a className="academy-button library-secondary" href={link('/labs')}><FlaskConical size={18}/>{labels.labs}</a>
        </div>
      </div>
      {featured&&<aside className="library-feature">
        {isRelativity&&<img src={relativityArt} width={800} height={600} alt={labels.image}/>}
        <div className="library-feature-copy">
          <span className="library-feature-label">{labels.featured}</span>
          <h2>{featured.title}</h2>
          {isRelativity&&<p>{labels.relativity}</p>}
          <a href={link('/courses/'+featured.id)}><BookOpen size={19}/>{labels.open}<ArrowLeft size={16}/></a>
        </div>
      </aside>}
    </div>
  </section>;
}
