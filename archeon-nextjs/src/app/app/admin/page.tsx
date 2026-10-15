import Link from "next/link";
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { currentAccount, database } from "@/features/auth/server";
import { adminAccount, allowedAdmin } from "@/features/admin/access";
import { AdminLock, AdminUnlock, FeedbackAction } from "./AdminClient";
import styles from "./admin.module.css";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Admin",robots:{index:false,follow:false}};
type Item={id:string;category:string;source_app:string;subject:string;message:string;reply_email:string|null;status:string;created_at:string};
export default async function AdminPage(){
 const account=await currentAccount().catch(()=>null);
 if(!account)redirect("/app/auth/sign-in?mode=login&next=%2Fapp%2Fadmin");
 if(!allowedAdmin(account))notFound();
 const unlocked=await adminAccount().catch(()=>null);
 let stats:Record<string,number>|null=null,feedback:Item[]=[],failure="";
 if(unlocked){try{
  const sql=database();
  const rows=await sql`SELECT
   (SELECT count(*) FROM archeon_users)::integer AS users,
   (SELECT count(*) FROM archeon_workspaces)::integer AS workspaces,
   (SELECT count(*) FROM tack_sync_documents)::integer AS tackboard_clouds,
   (SELECT count(*) FROM invoice_workspace_records)::integer AS invoices,
   (SELECT count(*) FROM invoice_workspace_clients)::integer AS clients,
   (SELECT count(*) FROM invoice_workspace_email_log)::integer AS email_events,
   (SELECT count(*) FROM archeon_feedback WHERE status='new')::integer AS feedback_new,
   (SELECT count(*) FROM archeon_feedback)::integer AS feedback_total,
   (SELECT count(*) FROM archeon_users WHERE created_at > NOW() - INTERVAL '7 days')::integer AS accounts_7d,
   (SELECT count(*) FROM invoice_workspace_records WHERE created_at > NOW() - INTERVAL '7 days')::integer AS invoices_7d,
   (SELECT count(*) FROM archeon_feedback WHERE created_at > NOW() - INTERVAL '7 days')::integer AS feedback_7d,
   pg_database_size(current_database())::bigint AS database_bytes`;
  stats=Object.fromEntries(Object.entries(rows[0]||{}).map(([k,v])=>[k,Number(v)]));
  const entries=await sql`SELECT id,category,source_app,subject,message,reply_email,status,created_at FROM archeon_feedback ORDER BY created_at DESC LIMIT 100`;
  feedback=entries.map(r=>({id:String(r.id),category:String(r.category),source_app:String(r.source_app),subject:String(r.subject),message:String(r.message),reply_email:r.reply_email?String(r.reply_email):null,status:String(r.status),created_at:String(r.created_at)}));
 }catch(err){console.error("Admin dashboard unavailable",err);failure="Could not load dashboard statistics. Check the feedback migration and database role permissions.";}}
 const size=stats?`${(stats.database_bytes/1024/1024).toFixed(2)} MiB`:"–";
 return <main className={styles.page}><div className={styles.wrap}><header className={styles.header}><div><Link href="/app">← All apps</Link><h1>archeon<span>.</span> admin</h1><p>Private operations workspace</p></div>{unlocked?<AdminLock/>:<Link href="/app/support">Support</Link>}</header>
 {!unlocked?<section className={styles.locked}><p className={styles.kicker}>AUTHORIZED ACCOUNT · REAUTHENTICATION REQUIRED</p><h2>Unlock operations</h2><AdminUnlock/></section>:<>
 <section className={styles.summary}><div><p className={styles.kicker}>DATABASE STATUS</p><h2>{failure?"Unavailable":"Connected"}</h2><small>{failure||"Neon PostgreSQL responded to this read."}</small></div><div><p className={styles.kicker}>DATABASE FOOTPRINT</p><h2>{size}</h2><small>PostgreSQL database size, not Neon compute/billing usage.</small></div></section>
 {stats&&<section className={styles.cards}>{([
  ["Accounts",stats.users],["Workspaces",stats.workspaces],["TackBoard cloud documents",stats.tackboard_clouds],["Invoices",stats.invoices],["Invoice clients",stats.clients],["Invoice send events",stats.email_events],["New feedback",stats.feedback_new],["Total feedback",stats.feedback_total],["New accounts · 7 days",stats.accounts_7d],["Invoices · 7 days",stats.invoices_7d],["Feedback · 7 days",stats.feedback_7d],
 ] as const).map(([name,n])=><article className={styles.card} key={name}><small>{name}</small><strong>{n.toLocaleString()}</strong></article>)}</section>}
 <section className={styles.inbox}><div className={styles.heading}><div><p className={styles.kicker}>SUPPORT & REQUESTS</p><h2>Feedback inbox</h2></div><span>Most recent 100</span></div>
 {feedback.length?feedback.map(item=><article className={styles.item} key={item.id}><div><small>{item.source_app.toUpperCase()} · {item.category.replaceAll("_"," ")} · {new Date(item.created_at).toLocaleDateString("en-GB")}</small><h3>{item.subject}</h3><p className={styles.body}>{item.message}</p>{item.reply_email&&<p className={styles.reply}>Reply to: {item.reply_email}</p>}</div><FeedbackAction id={item.id} status={item.status}/></article>):<p className={styles.empty}>No feedback yet.</p>}</section>
 <section className={styles.note}><h2>Operational scope</h2><p>These are database counts and health checks from Archeon. Neon compute consumption, branching quotas and billing require an authorized Neon management integration. Traffic analytics also require an analytics provider. Neither is represented by these counts.</p></section>
 </>}</div></main>;
}
