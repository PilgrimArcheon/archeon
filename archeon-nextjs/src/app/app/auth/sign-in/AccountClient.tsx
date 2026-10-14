"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Layers3 } from "lucide-react";
import styles from "./account.module.css";
type Mode = "register" | "login";
function safeReturnTo(value: string | null) {
  return value && value.startsWith("/app/") && !value.startsWith("//") && !value.includes("\\") ? value : "/app/tackboard";
}
export default function AccountClient() {
  const [mode, setMode] = useState<Mode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [next, setNext] = useState("/app/tackboard");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(safeReturnTo(params.get("next")));
    if (params.get("mode") === "login") setMode("login");
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      // These are the current account endpoints. The removed /password/* routes
      // returned HTML 404 pages and caused "Unexpected token '<'" when parsed as JSON.
      const response = await fetch(`/api/auth/${mode === "register" ? "register" : "login"}`, {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("The account service returned a webpage instead of an API response. Please refresh and try again; if it persists, contact Archeon support.");
      }
      const body: { error?: string; signedIn?: boolean } = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || `Account request failed (HTTP ${response.status}).`);
      if (!body.signedIn) throw new Error("The account service did not confirm the sign-in. Please try again.");
      window.location.assign(next);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to continue."); setBusy(false); }
  }
  return <main className={styles.screen}>
    <div className={styles.shell}>
      <div className={styles.head}><Link href="/" className={styles.wordmark}>archeon<span>.</span></Link><Link href="/app" className={styles.back}><ArrowLeft size={15}/> All apps</Link></div>
      <div className={styles.card}>
        <div className={styles.logo}><Layers3 size={24}/></div>
        <div className={styles.eyebrow}>ONE ACCOUNT, ALL YOUR TOOLS</div>
        <h1>{mode === "register" ? "Create your account." : "Welcome back."}</h1>
        <p>{mode === "register" ? "Keep your workspace yours. One Archeon account works across our apps." : "Sign in to your Archeon workspace."}</p>
        <div className={styles.switch} role="group" aria-label="Account action">
          <button type="button" aria-pressed={mode === "register"} className={mode === "register" ? styles.selected : ""} onClick={() => { setMode("register"); setError(""); }}>Create account</button>
          <button type="button" aria-pressed={mode === "login"} className={mode === "login" ? styles.selected : ""} onClick={() => { setMode("login"); setError(""); }}>Sign in</button>
        </div>
        <form onSubmit={submit}>
          <label className={styles.label}>Email address<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" maxLength={254}/></label>
          <label className={styles.label}>Password<div className={styles.password}><input type={show ? "text" : "password"} minLength={mode === "register" ? 12 : 1} maxLength={128} required autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode === "register" ? "At least 12 characters" : "Enter your password"}/><button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={()=>setShow(v=>!v)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
          {error && <div className={styles.error} role="alert">{error}</div>}
          <button className={styles.submit} type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}<ArrowRight size={16}/></button>
        </form>
        <div className={styles.foot}><LockKeyhole size={15}/> Your password is securely hashed before storage. No email verification or recovery yet.</div>
      </div>
      <p className={styles.note}>One Archeon account keeps your TackBoard workspace in sync across the web and paired desktop companions.</p>
    </div>
  </main>;
}
