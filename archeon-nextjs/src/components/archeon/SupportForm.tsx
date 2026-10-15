"use client";
import { useState } from "react";
import { feedbackCategories, feedbackSource, type FeedbackCategory } from "@/features/feedback/constants";
import styles from "@/app/app/support/support.module.css";
const labels: Record<FeedbackCategory, string> = {question:"Ask a question",bug:"Report a bug",feature:"Suggest an improvement",app_request:"Request a new app"};
export function SupportForm({source="archeon", initialCategory="question",compact=false}: {source?:string;initialCategory?:FeedbackCategory;compact?:boolean}) {
  const [category,setCategory]=useState<FeedbackCategory>(initialCategory);
  const [email,setEmail]=useState("");const [subject,setSubject]=useState("");const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);const [notice,setNotice]=useState("");const [success,setSuccess]=useState(false);
  async function send(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setNotice("");
    try {const response=await fetch("/api/feedback",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({category,source:feedbackSource(source),subject,message,email})});
      const result:{error?:string;success?:boolean}=await response.json().catch(()=>({}));
      if (!response.ok||!result.success)throw Error(result.error||"Could not send your message.");
      setSuccess(true);setNotice("Thanks. Your message was received by Archeon support.");setMessage("");setSubject("");
    } catch(error){setNotice(error instanceof Error?error.message:"Support is temporarily unavailable.");setSuccess(false);}
    finally {setBusy(false);}
  }
  return <form onSubmit={send} className={`${styles.form} ${compact?styles.compact:""}`}>
    <label>What can we help with?<select value={category} onChange={e=>setCategory(e.target.value as FeedbackCategory)}>{feedbackCategories.map(item=><option key={item} value={item}>{labels[item]}</option>)}</select></label>
    <label>Subject<input value={subject} onChange={e=>setSubject(e.target.value)} minLength={3} maxLength={160} placeholder={category==="app_request"?"What app should we build?":"A brief summary"} required/></label>
    <label>Your message<textarea value={message} onChange={e=>setMessage(e.target.value)} minLength={10} maxLength={4000} rows={compact?4:6} placeholder="Describe the issue, idea, or feature. Please don't include passwords or pairing keys." required/></label>
    <label>Email for a reply (optional)<input value={email} onChange={e=>setEmail(e.target.value)} type="email" maxLength={254} autoComplete="email" placeholder="you@example.com"/></label>
    <label className={styles.honeypot} aria-hidden="true">Leave empty<input name="website" tabIndex={-1} autoComplete="off"/></label>
    {notice && <p role="status" className={success?styles.success:styles.error}>{notice}</p>}
    <button className={styles.primary} type="submit" disabled={busy}>{busy?"Sending…":category==="app_request"?"Send app request":"Send to support"}</button>
    <small className={styles.hint}>Your message is stored privately for review. Avoid sharing confidential information.</small>
  </form>;
}
