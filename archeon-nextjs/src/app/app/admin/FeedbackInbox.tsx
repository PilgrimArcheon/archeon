"use client";
import { useMemo, useState } from "react";
import { FeedbackAction } from "./AdminClient";
import styles from "./admin.module.css";
import { downloadCsv } from "./downloadCsv";
export type AdminFeedback={id:string;category:string;source_app:string;subject:string;message:string;reply_email:string|null;status:string;created_at:string};
export function FeedbackInbox({items}:{items:AdminFeedback[]}){
 const [query,setQuery]=useState(""); const [status,setStatus]=useState("all"); const [source,setSource]=useState("all");
 const sources=useMemo(()=>Array.from(new Set(items.map(i=>i.source_app))).sort(),[items]);
 const filtered=items.filter(i=>(status==="all"||i.status===status)&&(source==="all"||i.source_app===source)&&`${i.subject} ${i.message} ${i.category} ${i.reply_email||""}`.toLowerCase().includes(query.toLowerCase()));
 return <section id="feedback" className={styles.inbox} aria-labelledby="feedback-heading">
  <div className={styles.sectionHead}><div><p className={styles.kicker}>SUPPORT / REQUESTS</p><h2 id="feedback-heading">Feedback inbox</h2><p>Private requests, bug reports and product suggestions.</p></div><div className={styles.chartControls}><span className={styles.resultCount}>{filtered.length} of {items.length} shown</span><button className={styles.secondary} type="button" onClick={()=>downloadCsv("archeon-feedback.csv",["Date","Source","Category","Subject","Message","Reply email","Status"],filtered.map(item=>[item.created_at,item.source_app,item.category,item.subject,item.message,item.reply_email||"",item.status]))}>Export CSV</button></div></div>
  <div className={styles.inboxTools}><label><span className={styles.srOnly}>Search feedback</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search messages..." /></label>
   <label><span className={styles.srOnly}>Filter by status</span><select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All statuses</option><option value="new">New</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option></select></label>
   <label><span className={styles.srOnly}>Filter by source</span><select value={source} onChange={e=>setSource(e.target.value)}><option value="all">All apps</option>{sources.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
  </div>
  {filtered.length?filtered.map(item=><article className={styles.item} key={item.id}><div><small>{item.source_app.toUpperCase()} · {item.category.replaceAll("_"," ")} · {new Date(item.created_at).toLocaleDateString("en-GB")}</small><h3>{item.subject}</h3><p className={styles.body}>{item.message}</p>{item.reply_email&&<p className={styles.reply}>Reply to: {item.reply_email}</p>}</div><FeedbackAction id={item.id} status={item.status}/></article>):<p className={styles.empty}>No matching requests.</p>}
 </section>
}
