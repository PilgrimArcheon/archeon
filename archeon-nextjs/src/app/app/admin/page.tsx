import Link from "next/link";
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { currentAccount, database } from "@/features/auth/server";
import { adminAccount, allowedAdmin } from "@/features/admin/access";
import { AdminLock, AdminUnlock } from "./AdminClient";
import { AdminCharts, type DailyActivity } from "./AdminCharts";
import { FeedbackInbox, type AdminFeedback } from "./FeedbackInbox";
import styles from "./admin.module.css";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Admin",robots:{index:false,follow:false}};

export default async function AdminPage(){
 const account=await currentAccount().catch(()=>null);
 if(!account)redirect("/app/auth/sign-in?mode=login&next=%2Fapp%2Fadmin");
 if(!allowedAdmin(account))notFound();
 const unlocked=await adminAccount().catch(()=>null);
 let stats:Record<string,number>|null=null,feedback:AdminFeedback[]=[],activity:DailyActivity[]=[],failure="";
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
   pg_database_size(current_database())::bigint AS database_bytes,
   (SELECT count(*) FROM archeon_feedback WHERE status='reviewing')::integer AS feedback_reviewing,
   (SELECT count(*) FROM archeon_feedback WHERE status='resolved')::integer AS feedback_resolved`;
  stats=Object.fromEntries(Object.entries(rows[0]||{}).map(([k,v])=>[k,Number(v)]));
  const daily=await sql`SELECT to_char(day,'YYYY-MM-DD') AS day,
    (SELECT count(*) FROM archeon_users WHERE created_at >= day AND created_at < day + INTERVAL '1 day')::integer AS accounts,
    (SELECT count(*) FROM invoice_workspace_records WHERE created_at >= day AND created_at < day + INTERVAL '1 day')::integer AS invoices,
    (SELECT count(*) FROM archeon_feedback WHERE created_at >= day AND created_at < day + INTERVAL '1 day')::integer AS feedback
    FROM generate_series(date_trunc('day',now()) - INTERVAL '29 days',date_trunc('day',now()),INTERVAL '1 day') AS series(day) ORDER BY day`;
  activity=daily.map(r=>({day:String(r.day),accounts:Number(r.accounts),invoices:Number(r.invoices),feedback:Number(r.feedback)}));
  const entries=await sql`SELECT id,category,source_app,subject,message,reply_email,status,created_at FROM archeon_feedback ORDER BY created_at DESC LIMIT 100`;
  feedback=entries.map(r=>({id:String(r.id),category:String(r.category),source_app:String(r.source_app),subject:String(r.subject),message:String(r.message),reply_email:r.reply_email?String(r.reply_email):null,status:String(r.status),created_at:String(r.created_at)}));
 }catch(err){console.error("Admin dashboard unavailable",err);failure="Could not load dashboard statistics. Check the feedback migration and database role permissions.";}}
 const size=stats?`${(stats.database_bytes/1024/1024).toFixed(2)} MiB`:"–";
 const metrics:[string,number|undefined,string][]=[
  ["Accounts",stats?.users,"Registered Archeon accounts"],
  ["Workspaces",stats?.workspaces,"Shared web workspaces"],
  ["TackBoard documents",stats?.tackboard_clouds,"Synced taskboards"],
  ["Invoices",stats?.invoices,"Created invoices"],
  ["Clients",stats?.clients,"Saved invoice clients"],
  ["Send events",stats?.email_events,"Invoice mail activity"],
  ["New feedback",stats?.feedback_new,"Waiting for review"],
  ["Total requests",stats?.feedback_total,"All support and app requests"],
 ];
 return <main className={styles.page}>
  <div className={styles.wrap}>
   <header className={styles.header}>
    <Link href="/" className={styles.wordmark} aria-label="Archeon homepage">archeon<span>.</span></Link>
    <nav className={styles.navigation} aria-label="Admin sections"><a href="#overview">Overview</a>{unlocked&&<><a href="#activity">Activity</a><a href="#feedback">Feedback</a><a href="#database">Database</a></>}</nav>
    {unlocked?<AdminLock/>:<Link className={styles.supportLink} href="/app/support?source=archeon">Support</Link>}
   </header>
   <div id="overview" className={styles.intro}><div><p className={styles.kicker}>ARCHEON / OPERATIONS</p><h1>Workspace overview<span>.</span></h1><p>One clear view of your applications, activity and support.</p></div><div className={styles.statusBadge}><span className={styles.statusDot}/>{unlocked?"Admin session active":"Restricted access"}</div></div>
   {!unlocked?<section className={styles.locked}><p className={styles.kicker}>REAUTHENTICATION REQUIRED</p><h2>Unlock your dashboard</h2><AdminUnlock/></section>:<>
    <section id="database" className={styles.summary} aria-label="Database health">
     <article className={styles.health}><div><p className={styles.kicker}>DATABASE / CONNECTION</p><h2>{failure?"Needs attention":"Connected"}</h2><small>{failure||"PostgreSQL health check passed."}</small></div><div className={styles.healthIcon} aria-hidden="true">{failure?"!":"↗"}</div></article>
     <article className={styles.footprint}><p className={styles.kicker}>DATABASE / STORAGE</p><h2>{size}</h2><small>PostgreSQL footprint · not Neon compute or billing</small></article>
    </section>
    {stats&&<><section aria-labelledby="metric-heading" className={styles.metricsSection}><div className={styles.sectionHead}><div><p className={styles.kicker}>LIVE DATA</p><h2 id="metric-heading">At a glance</h2></div><span className={styles.updated}>Current database snapshot</span></div>
      <div className={styles.cards}>{metrics.map(([name,n,description])=><article className={styles.card} key={name}><small>{name}</small><strong>{n?.toLocaleString()??"—"}</strong><p>{description}</p></article>)}</div>
     </section>
     <AdminCharts activity={activity} statusCounts={{new:stats.feedback_new,reviewing:stats.feedback_reviewing,resolved:stats.feedback_resolved}} />
     <div className={styles.recentStrip} aria-label="Last seven days"><div><strong>{stats.accounts_7d}</strong><span>New accounts · 7 days</span></div><div><strong>{stats.invoices_7d}</strong><span>Invoices · 7 days</span></div><div><strong>{stats.feedback_7d}</strong><span>Feedback · 7 days</span></div></div>
    </>}
    <FeedbackInbox items={feedback}/>
    <section className={styles.note}><h2>About these metrics</h2><p>All numbers shown here come from Archeon PostgreSQL records. Neon compute, branch quotas and billing need a separately authorized Neon management integration. Site traffic needs an analytics provider. Neither is estimated or presented as collected data.</p></section>
   </>}
   <footer className={styles.footer}><span>© {new Date().getFullYear()} archeon.</span><Link href="/app">Explore apps</Link></footer>
  </div>
 </main>;
}
