"use client";
import { useMemo, useState } from "react";
import styles from "./admin.module.css";
import { downloadCsv } from "./downloadCsv";

export type DailyActivity = { day:string; accounts:number; invoices:number; feedback:number };
type SeriesKey = "accounts" | "invoices" | "feedback";
const series: {key:SeriesKey;label:string;className:string}[] = [
  {key:"accounts",label:"Accounts",className:styles.seriesAccounts},
  {key:"invoices",label:"Invoices",className:styles.seriesInvoices},
  {key:"feedback",label:"Feedback",className:styles.seriesFeedback},
];
export function AdminCharts({activity, statusCounts}:{activity:DailyActivity[];statusCounts:{new:number;reviewing:number;resolved:number}}){
  const [days,setDays]=useState<7|30>(7);
  const [selected,setSelected]=useState<SeriesKey[]>(["accounts","invoices","feedback"]);
  const visible=useMemo(()=>activity.slice(-days),[activity,days]);
  const max=Math.max(1,...visible.flatMap(d=>selected.map(k=>d[k])));
  const tickLabels=visible.filter((_,i)=>i===0||i===visible.length-1||i%Math.max(1,Math.floor(visible.length/5))===0);
  const total=statusCounts.new+statusCounts.reviewing+statusCounts.resolved;
  const current=total?statusCounts.new/total*100:0;
  const review=total?statusCounts.reviewing/total*100:0;
  const donut={background:total?`conic-gradient(var(--chart-primary) 0% ${current}%,var(--chart-mid) ${current}% ${current+review}%,var(--chart-light) ${current+review}% 100%)`:`conic-gradient(var(--archeon-line) 0 100%)`};
  return <section id="activity" className={styles.chartSection} aria-labelledby="activity-heading">
    <div className={styles.sectionHead}><div><p className={styles.kicker}>ACTIVITY / TRENDS</p><h2 id="activity-heading">Workspace activity</h2><p>Actual counts from your Archeon database, by day.</p></div>
      <div className={styles.chartControls}><button className={styles.secondary} type="button" onClick={()=>downloadCsv("archeon-activity.csv",["Date","Accounts","Invoices","Feedback"],visible.map(item=>[item.day,item.accounts,item.invoices,item.feedback]))}>Export CSV</button>
      <div className={styles.segment} aria-label="Chart date range"><button type="button" aria-pressed={days===7} onClick={()=>setDays(7)}>7 days</button><button type="button" aria-pressed={days===30} onClick={()=>setDays(30)}>30 days</button></div></div>
    </div>
    <div className={styles.chartGrid}>
      <div className={styles.chartCard}><div className={styles.chartHead}><h3>Activity over time</h3><span>{days}-day view</span></div>
        <div className={styles.legend} aria-label="Data series">{series.map(item=><button key={item.key} type="button" aria-pressed={selected.includes(item.key)} onClick={()=>setSelected(old=>old.includes(item.key)?old.filter(k=>k!==item.key):[...old,item.key])} className={item.className}><i/>{item.label}</button>)}</div>
        <div className={styles.graph}><svg viewBox="0 0 720 230" preserveAspectRatio="none" role="img" aria-label={`Accounts, invoices and feedback created during the past ${days} days`}>
          {[0,.25,.5,.75,1].map(t=><line key={t} x1="20" y1={200-t*175} x2="704" y2={200-t*175} className={styles.gridline}/>) }
          {series.filter(item=>selected.includes(item.key)).map(item=><polyline key={item.key} fill="none" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" className={item.className} points={visible.map((d,i)=>`${20+(i/Math.max(1,visible.length-1))*684},${200-d[item.key]/max*175}`).join(" ")} />)}
        </svg></div>
        <div className={styles.chartAxis}>{tickLabels.map(d=><span key={d.day}>{new Date(`${d.day}T12:00:00Z`).toLocaleDateString("en-GB",{month:"short",day:"numeric",timeZone:"UTC"})}</span>)}</div>
      </div>
      <div className={styles.chartCard}><div className={styles.chartHead}><h3>Feedback status</h3><span>All time</span></div>
        <div className={styles.donutWrap}><div className={styles.donut} style={donut}><div><strong>{total.toLocaleString()}</strong><small>Total requests</small></div></div></div>
        <div className={styles.breakdown}><div><i className={styles.seriesAccounts}/><span>New</span><strong>{statusCounts.new}</strong></div><div><i className={styles.seriesInvoices}/><span>Reviewing</span><strong>{statusCounts.reviewing}</strong></div><div><i className={styles.seriesFeedback}/><span>Resolved</span><strong>{statusCounts.resolved}</strong></div></div>
      </div>
    </div>
  </section>;
}
