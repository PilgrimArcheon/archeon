"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Download, ExternalLink, Mail, Send, Unplug } from "lucide-react";

type Connection = { configured: boolean; connected: boolean; email: string | null };
type Reply<T> = { success: true; data: T } | { success: false; error: { message: string } };
export default function EmailComposer({ invoiceId, invoiceNo, to, client, business, documentType }: {
  invoiceId: string; invoiceNo: string; to: string; client: string; business: string; documentType: "invoice" | "receipt";
}) {
  const isReceipt = documentType === "receipt";
  const [connection, setConnection] = useState<Connection | null>(null);
  const recipient = to;
  const [subject, setSubject] = useState(isReceipt ? `Payment receipt for invoice ${invoiceNo} from ${business}` : `Invoice ${invoiceNo} from ${business}`);
  const [message, setMessage] = useState(isReceipt
    ? `Hello ${client || "there"},\n\nThank you for your payment. Attached is your receipt confirming full payment for invoice ${invoiceNo}.\n\nBest regards,\n${business}`
    : `Hello ${client || "there"},\n\nPlease find attached invoice ${invoiceNo}.\n\nThank you,\n${business}`);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/apps/invoice/gmail/connection", { cache: "no-store" });
      const body = (await response.json()) as Reply<Connection>;
      if (!response.ok || !body.success) throw Error(!body.success ? body.error.message : "Cannot load Gmail connection");
      setConnection(body.data);
    } catch (e) { setError(e instanceof Error ? e.message : "Cannot load Gmail connection"); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get("gmail");
    if (reason === "connected") setNotice("Gmail connected. You can send the PDF directly from this page.");
    else if (reason) {
      const errors: Record<string, string> = {
        setup: "Google OAuth is not configured. You can still open a Gmail draft in another tab.",
        permission: "Google shared your basic account details but did not authorize Gmail sending. Click Connect Gmail again and approve 'Send email on your behalf'.",
        "refresh-token": "Google did not issue a long-term access token. Try connecting again; if this persists, remove Archeon Apps from your Google Account's third-party connections and retry.",
        identity: "Google could not confirm your Gmail address. Check your Google account and try again.",
        "database-schema": "The Gmail connections table is missing in Neon. Run scripts/gmail-oauth-migration.sql in the database selected by ARCHEON_DATABASE_URL.",
        "google-error": "Google could not complete authorization. Check the local server log for the exact stage, then try again.",
      };
      setError(errors[reason] || "Gmail connection was not completed. Try again, or use the manual Gmail draft.");
    }
  }, []);
  const composeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  const validRecipient = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient);
  async function send() {
    setError(""); setNotice("");
    if (recipient.trim().toLowerCase() !== to.trim().toLowerCase()) {
      setError("Update the invoice's client email and save it before sending."); return;
    }
    if (!validRecipient || !subject.trim() || !message.trim()) { setError("Enter a valid recipient, subject and message."); return; }
    if (!window.confirm(`Send the ${isReceipt ? "payment receipt" : "invoice"} for ${invoiceNo} as a PDF to ${recipient} from your connected Gmail?`)) return;
    setBusy("send");
    try {
      const response = await fetch(`/api/apps/invoice/invoices/${invoiceId}/send`, {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, documentType }),
      });
      const body = await response.json() as Reply<{ sent: boolean }>;
      if (!response.ok || !body.success) throw Error(!body.success ? body.error.message : "Sending failed");
      if (!isReceipt && typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("archeon_invoice_updates");
        channel.postMessage({ type: "sent", invoiceId });
        channel.close();
      }
      setNotice(isReceipt ? "Gmail accepted the payment receipt PDF. Your payment records are unchanged." : "Gmail accepted the invoice email with its PDF attached. The invoice is marked as sent.");
    } catch (e) { setError(e instanceof Error ? e.message : "Sending failed"); }
    finally { setBusy(""); }
  }
  async function disconnect() {
    if (!window.confirm("Disconnect Gmail from this Archeon workspace?")) return;
    setBusy("disconnect"); setError("");
    try {
      const response = await fetch("/api/apps/invoice/gmail/disconnect", { method: "POST", credentials: "same-origin" });
      if (!response.ok) throw Error("Could not disconnect Gmail.");
      await load(); setNotice("Gmail disconnected.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not disconnect Gmail."); }
    finally { setBusy(""); }
  }
  return <div className="invoice-app"><main className="archeon-email-page">
    <header className="archeon-email-head">
      <a href="/app/invoice" className="btn btn-outline"><ArrowLeft size={16}/> Invoice Studio</a>
      <span>ARCHEON / INVOICE EMAIL</span>
    </header>
    <div className="page-intro"><div><div className="eyebrow">{isReceipt ? "EMAIL PAYMENT RECEIPT" : "EMAIL AN INVOICE"}</div><h1>{isReceipt ? "Receipt" : "Send"} {invoiceNo}<span className="title-dot">.</span></h1>
      <p>This composer opens separately from your invoice workspace. Only the connected Gmail account sends email; Archeon never asks for your Gmail password.</p></div></div>
    {error && <div className="notice danger" role="alert">{error}</div>}
    {notice && <div className="notice success" role="status"><CheckCircle2 size={16}/> {notice}</div>}
    <div className="archeon-email-grid">
      <section className="form-card">
        <div className="card-heading"><div className="card-icon"><Mail size={18}/></div><div><h2>Email message</h2><p>Review your message before sending.</p></div></div>
        <div className="form-grid">
          <label className="field span-two"><span className="field-label">To (from saved invoice)</span><input type="email" value={recipient} readOnly aria-readonly="true" /></label>
          <label className="field span-two"><span className="field-label">Subject</span><input value={subject} maxLength={240} onChange={e=>setSubject(e.target.value)} /></label>
          <label className="field span-two"><span className="field-label">Message</span><textarea rows={10} value={message} maxLength={6000} onChange={e=>setMessage(e.target.value)}/></label>
        </div>
        <div className="archeon-email-buttons">
          <button type="button" className="btn btn-primary" disabled={!connection?.connected || !!busy || !validRecipient} onClick={send}><Send size={16}/>{busy === "send" ? "Sending…" : "Send with PDF via Gmail"}</button>
          <a className="btn btn-outline" href={composeUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/> Open Gmail draft in new tab</a>
        </div>
        <p className="archeon-email-note">Gmail draft opens without an attachment. Download the {isReceipt ? "receipt" : "invoice"} PDF below and attach it yourself. Opening a draft does not update invoice status.</p>
      </section>
      <aside className="form-card">
        <div className="card-heading"><div className="card-icon"><Mail size={18}/></div><div><h2>Gmail connection</h2><p>Optional for automatic delivery</p></div></div>
        <p>{connection?.connected ? `Connected as ${connection.email}` : connection?.configured === false ? "Google OAuth is not configured yet. Manual Gmail drafts still work." : "Connect your own Gmail address to send invoice PDFs without a separate email service."}</p>
        {connection?.configured && !connection.connected && <a className="btn btn-primary" href={`/api/apps/invoice/gmail/start?invoiceId=${encodeURIComponent(invoiceId)}&document=${documentType}`}><Mail size={16}/> Connect Gmail</a>}
        {connection?.connected && <button className="btn btn-outline" disabled={!!busy} onClick={disconnect}><Unplug size={16}/> Disconnect Gmail</button>}
        <hr/>
        <a className="btn btn-outline" href={`/api/apps/invoice/invoices/${invoiceId}/${isReceipt ? "receipt" : "pdf"}`} target="_blank" rel="noopener noreferrer"><Download size={16}/> Download {isReceipt ? "receipt" : "invoice"} PDF <ArrowUpRight size={14}/></a>
        <p className="archeon-email-note">The Gmail API uses send-only access. Google may require verification before you can offer automated sending to everyone.</p>
      </aside>
    </div>
  </main></div>;
}
