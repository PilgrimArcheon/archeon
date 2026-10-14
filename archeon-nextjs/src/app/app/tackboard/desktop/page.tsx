import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "TackBoard Desktop — Archeon", description: "Keep editable sticky notes in a compact, always-on-top Windows desktop companion." };
const download = process.env.NEXT_PUBLIC_TACKBOARD_WINDOWS_DOWNLOAD_URL || "";
const release = (() => { try {const u=new URL(download);return u.protocol === "https:" ? u.href : null;} catch {return null;} })();
export default function DesktopPage() {
  return <main style={{minHeight:"100vh",background:"#0e1010",color:"#eceeea",padding:"clamp(24px,7vw,110px) 24px",fontFamily:"inherit"}}>
    <div style={{maxWidth:980,margin:"0 auto"}}>
      <Link href="/app/tackboard" style={{color:"#a4b5aa",fontSize:13,textDecoration:"none"}}>← Back to TackBoard</Link>
      <p style={{fontSize:11,letterSpacing:".2em",color:"#93a699",marginTop:70}}>ARCHEON / DESKTOP COMPANION</p>
      <h1 style={{fontSize:"clamp(48px,9vw,100px)",letterSpacing:"-.075em",lineHeight:1,margin:"12px 0 24px"}}>Your notes.<br/><span style={{color:"#81968a"}}>Off the tab.</span></h1>
      <p style={{fontSize:17,lineHeight:1.8,maxWidth:530,color:"#adb8b0"}}>A small pinboard that lives on your desktop. Keep sticky notes stacked in the corner, tick off tasks, edit them, or expand to see the full board. Synced with your Archeon account.</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:12,margin:"34px 0 64px"}}>
        {release ? <a href={release} style={{background:"#e9ede5",color:"#19231d",padding:"14px 22px",borderRadius:7,textDecoration:"none",fontWeight:700}}>Download for Windows ↗</a> : <span style={{background:"#272d29",color:"#d6ded6",padding:"14px 22px",borderRadius:7}}>Windows installer being prepared</span>}
        <Link href="/app/tackboard" style={{border:"1px solid #39423b",color:"#d5ddd6",padding:"14px 22px",borderRadius:7,textDecoration:"none"}}>Open web board ↗</Link>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
        {[
          ["01 / COMPACT", "Your note stack", "A small always-on-top window, with editable checkboxes and quick note creation."],
          ["02 / EXPAND", "The whole board", "Expand the widget to see all your notes, edit checklists, or switch boards."],
          ["03 / SYNC", "One account, everywhere", "Use your TackBoard device pairing key to connect with Neon cloud sync."],
        ].map(([num,title,body])=><div key={num} style={{border:"1px solid #343b37",background:"#171a18",borderRadius:8,padding:22,minHeight:190}}><div style={{fontSize:10,color:"#91a89a",letterSpacing:".1em"}}>{num}</div><h2 style={{fontSize:23,letterSpacing:"-.04em",margin:"30px 0 10px"}}>{title}</h2><p style={{color:"#acb9ae",fontSize:13,lineHeight:1.7}}>{body}</p></div>)}
      </div>
      <p style={{marginTop:35,color:"#8b9990",fontSize:12,lineHeight:1.7}}>Desktop source is in <code>desktop/tackboard</code> of the Archeon project. On Windows: run <code>npm install</code>, <code>npm run dev</code> to test, or <code>npm run dist:win</code> to package an installer. Download links will appear here after you publish a Windows build and configure <code>NEXT_PUBLIC_TACKBOARD_WINDOWS_DOWNLOAD_URL</code>.</p>
    </div>
  </main>;
}
