"use client";
import { useEffect, useRef, useState } from "react";
import { SupportForm } from "./SupportForm";
import styles from "./request-app.module.css";
export function RequestAppButton() {
 const [open,setOpen]=useState(false);const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const node=dialog.current;if (!node)return;if(open&&!node.open)node.showModal();if(!open&&node.open)node.close();},[open]);
 return <><button className={styles.trigger} type="button" onClick={()=>setOpen(true)}>+ Request an app</button>
 <dialog ref={dialog} className={styles.modal} onClose={()=>setOpen(false)} onClick={e=>{if(e.target===dialog.current)setOpen(false);}} aria-labelledby="request-app-title">
  <header><div><small>ARCHEON / NEW IDEAS</small><h2 id="request-app-title">What should we build next?</h2></div><button aria-label="Close request form" type="button" onClick={()=>setOpen(false)}>×</button></header>
  <p>Share a useful app idea. Requests arrive in Archeon's private feedback inbox.</p>
  <SupportForm source="apps" initialCategory="app_request" compact/>
 </dialog></>;
}
