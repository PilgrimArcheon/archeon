"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./admin.module.css";
export function AdminUnlock(){const [password,setPassword]=useState("");const [error,setError]=useState("");const [busy,setBusy]=useState(false);const router=useRouter();
 async function unlock(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{
  const r=await fetch("/api/admin/unlock",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});
  const json:{error?:string}=await r.json().catch(()=>({}));if(!r.ok)throw Error(json.error||"Access denied");setPassword("");router.refresh();
 }catch(err){setError(err instanceof Error?err.message:"Access denied");}finally{setBusy(false);}}
 return <form onSubmit={unlock} className={styles.unlock}><p>Enter your Archeon account password to unlock this private dashboard for 20 minutes.</p><label>Account password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p role="alert" className={styles.error}>{error}</p>}<button disabled={busy}>{busy?"Checking…":"Unlock dashboard"}</button></form>;
}
export function AdminLock(){const router=useRouter();return <button className={styles.secondary} onClick={async()=>{await fetch("/api/admin/unlock",{method:"DELETE",credentials:"same-origin"});router.refresh();}}>Lock dashboard</button>;}
export function FeedbackAction({id,status}: {id:string;status:string}){const [busy,setBusy]=useState(false);const [error,setError]=useState("");const router=useRouter();
 return <div><select aria-label="Feedback status" value={status} disabled={busy} onChange={async e=>{setBusy(true);setError("");try{const r=await fetch(`/api/admin/feedback/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:e.target.value})});if(!r.ok)throw Error("Update failed");router.refresh();}catch{setError("Retry");}finally{setBusy(false);}}}><option value="new">New</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option></select>{error&&<small>{error}</small>}<button className={styles.secondary} disabled={busy} onClick={async()=>{if(!confirm("Delete this feedback message permanently?"))return;setBusy(true);try{const r=await fetch(`/api/admin/feedback/${id}`,{method:"DELETE"});if(!r.ok)throw Error();router.refresh();}catch{setError("Delete failed");}finally{setBusy(false);}}}>Delete</button></div>;
}
