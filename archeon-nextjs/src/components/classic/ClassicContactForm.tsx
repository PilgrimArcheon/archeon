"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { site } from "@/data/site";

type Status = "idle" | "sending" | "sent" | "email-client" | "error";

export function ClassicContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    if (!name || !email || !message) return;
    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, company: data.get("company") }),
      });
      const result: { success?: boolean; code?: string } = await response.json();
      if (response.ok && result.success) { setStatus("sent"); form.reset(); }
      else if (result.code === "MAIL_NOT_CONFIGURED") {
        const subject = encodeURIComponent(`Project From: ${name}`);
        const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
        window.location.href = `mailto:${site.emailForProjects}?subject=${subject}&body=${body}`;
        setStatus("email-client");
      } else { setStatus("error"); }
    } catch { setStatus("error"); }
  }

  return (
    <form className="contact__form" onSubmit={onSubmit} id="form">
      <div className="contact__form-div">
        <label className="contact__form-tag" htmlFor="classic-name">Name</label>
        <input id="classic-name" name="name" className="contact__form-input" type="text" placeholder="Name" autoComplete="name" maxLength={100} required />
      </div>
      <div className="contact__form-div">
        <label className="contact__form-tag" htmlFor="classic-email">Email</label>
        <input id="classic-email" name="email" className="contact__form-input" type="email" placeholder="Email" autoComplete="email" maxLength={254} required />
      </div>
      <div className="contact__form-div contact__form-area">
        <label className="contact__form-tag" htmlFor="classic-message">Project</label>
        <textarea id="classic-message" name="message" className="contact__form-input" rows={10} placeholder="Write your Project" minLength={10} maxLength={5000} required />
      </div>
      <div hidden aria-hidden="true"><label htmlFor="classic-company">Leave empty</label><input name="company" id="classic-company" tabIndex={-1} autoComplete="off" /></div>
      <button className="button" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Send Message"}
      </button>
      <p role="status" aria-live="polite" className="contact__form-feedback">
        {status === "sent" && "Your message was sent. Thanks for reaching out!"}
        {status === "email-client" && "Your email app will open a prepared message. Please press Send there to finish."}
        {status === "error" && <>Message couldn&apos;t be delivered. <a href={`mailto:${site.email}`} className="contact__button">Email me instead <ArrowRight size={15} /></a></>}
      </p>
    </form>
  );
}
