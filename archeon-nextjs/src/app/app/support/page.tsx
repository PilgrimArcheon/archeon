import type { Metadata } from "next";
import Link from "next/link";
import { feedbackSource, faqItems, type FeedbackCategory, feedbackCategories } from "@/features/feedback/constants";
import { SupportForm } from "@/components/archeon/SupportForm";
import styles from "./support.module.css";
export const metadata:Metadata={title:"Support",description:"Frequently asked questions, bug reports and product suggestions for Archeon Apps."};
type Props={searchParams:Promise<{source?:string;type?:string}>};
export default async function SupportPage({searchParams}:Props){const params=await searchParams;
 const source=feedbackSource(params.source);
 const destinations: Record<string,{href:string;label:string}>={
  tackboard:{href:"/app/tackboard",label:"TackBoard"},invoice:{href:"/app/invoice",label:"Invoice Studio"},
  pocketline:{href:"/products/pocketline",label:"Pocketline"},gatherly:{href:"/products/gatherly",label:"Gatherly"},
  portfolio:{href:"/",label:"portfolio"},archeon:{href:"/",label:"Archeon"},apps:{href:"/app",label:"All apps"}
 };
 const destination=destinations[source] || destinations.apps;
 const type=feedbackCategories.includes(params.type as FeedbackCategory)?params.type as FeedbackCategory:"question";
 return <main className={styles.page}><div className={styles.wrap}>
  <nav className={styles.nav}><Link href="/" className={styles.wordmark}>archeon<span>.</span></Link><Link href={destination.href} className={styles.returnLink}>← Back to {destination.label}</Link></nav>
  <div className={styles.hero}><p className={styles.kicker}>HELP & FEEDBACK</p><h1>Here when you need us<span>.</span></h1><p>Answers, bug reports and ideas for Archeon products. Everything comes through one support inbox.</p></div>
  <div className={styles.columns}><section><h2>Frequently asked questions</h2><div className={styles.faq}>{faqItems.map((item)=><details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div></section>
  <section id="contact" className={styles.support}><p className={styles.kicker}>{source.toUpperCase()} / SUPPORT</p><h2>Send a message</h2><p>Tell us what you need. We’ll review it in the private Archeon inbox.</p><SupportForm key={`${source}-${type}`} source={source} initialCategory={type}/></section></div>
  <footer className={styles.bottom}><Link href={destination.href}>← Back to {destination.label}</Link><span>Built by archeon.</span></footer>
 </div></main>;
}
