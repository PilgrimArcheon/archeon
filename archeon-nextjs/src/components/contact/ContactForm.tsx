"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight, CheckCircle2, Send } from "lucide-react";
import { site } from "@/data/site";

type FormStatus = "idle" | "sending" | "sent" | "error";
const fieldClass = "mt-2 w-full rounded-2xl border border-line bg-background px-4 py-3.5 text-sm text-foreground placeholder:text-subtle outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15";

export function ContactForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const name = String(values.get("name") || "").trim();
    const email = String(values.get("email") || "").trim();
    const message = String(values.get("message") || "").trim();
    const company = String(values.get("company") || "");
    if (!name || !email || !message) return;
    setError("");
    setStatus("sending");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({category:"question",source:"portfolio",subject:`Portfolio enquiry from ${name}`,email,message,website:company}),
      });
      const result: { success?: boolean; error?: string } = await response.json();
      if (response.ok && result.success) {
        setStatus("sent");
        form.reset();
      } else if (!response.ok) {
        throw new Error(result.error || "Delivery failed");
      } else {
        throw new Error("Delivery failed");
      }
    } catch {
      setError("The message couldn't be sent right now. Please email me directly instead.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-line bg-surface p-6 sm:p-9">
      <h2 className="text-2xl font-semibold tracking-tight">Tell me about your project.</h2>
      <p className="mt-3 text-sm leading-7 text-muted">Share a little about what you&apos;re building and I&apos;ll get back to you.</p>
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <div><label htmlFor="contact-name" className="text-sm font-semibold">Your name <span className="text-accent">*</span></label><input className={fieldClass} id="contact-name" name="name" type="text" autoComplete="name" maxLength={100} required placeholder="Your name" /></div>
        <div><label htmlFor="contact-email" className="text-sm font-semibold">Email address <span className="text-accent">*</span></label><input className={fieldClass} id="contact-email" name="email" type="email" autoComplete="email" maxLength={254} required placeholder="you@example.com" /></div>
      </div>
      <div className="mt-5"><label htmlFor="contact-message" className="text-sm font-semibold">Project details <span className="text-accent">*</span></label><textarea className={`${fieldClass} min-h-44 resize-y`} id="contact-message" name="message" rows={6} minLength={10} maxLength={4000} required placeholder="Your idea, timeline, project goals..." /></div>
      <div className="absolute -left-[9999px]" aria-hidden="true"><label htmlFor="contact-company">Leave this field empty</label><input id="contact-company" name="company" tabIndex={-1} autoComplete="off" /></div>
      <button type="submit" disabled={status === "sending"} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-[#171222] transition-colors hover:bg-accent-strong hover:text-white disabled:cursor-wait disabled:opacity-70 sm:w-auto">
        {status === "sending" ? "Sending..." : "Send message"} <Send size={16} aria-hidden />
      </button>
      <div className="mt-4 text-sm leading-7" role="status" aria-live="polite">
        {status === "sent" && <p className="inline-flex items-start gap-2 text-accent"><CheckCircle2 size={18} className="mt-1 shrink-0" aria-hidden />Message sent — thanks for reaching out!</p>}
        {status === "error" && <p className="text-muted">{error} <a href={`mailto:${site.email}`} className="inline-flex items-center gap-1 font-semibold text-accent">Email directly <ArrowUpRight size={14} aria-hidden /></a></p>}
        {status === "idle" && <p className="text-xs text-subtle">Messages are sent privately to Archeon support.</p>}
      </div>
    </form>
  );
}
