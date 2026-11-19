import type { Metadata } from 'next';
import './globals.css';
import './academy.css';
import './portfolio.css';
import 'katex/dist/katex.min.css';
export const metadata:Metadata={icons:{icon:'/favicon.svg'},title:'ذبیح‌الله اسحاقی | خانهٔ علم و آموزش',description:'درس‌های فیزیک، لابراتوار، جزوه و یادداشت‌های علمی ذبیح‌الله اسحاقی'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="fa" dir="rtl"><body>{children}</body></html>}
