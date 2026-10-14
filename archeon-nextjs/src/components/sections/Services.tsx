"use client";

import { useRef } from "react";
import { ArrowUpRight, Check, Code2, Gamepad2, Palette, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { services } from "@/data/site";
import type { Service } from "@/types/content";

const icons = { game: Gamepad2, code: Code2, design: Palette };

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const Icon = icons[service.icon];
  return (
    <>
      <article className="flex h-full flex-col rounded-3xl border border-line bg-surface p-7 transition-colors hover:border-accent/60 sm:p-8">
        <div className="flex items-start justify-between"><div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent"><Icon size={27} aria-hidden /></div><span className="text-sm font-semibold text-subtle">0{index + 1}</span></div>
        <h3 className="mt-10 max-w-xs text-2xl font-semibold tracking-tight text-foreground">{service.title}</h3>
        <p className="mt-4 flex-1 text-sm leading-7 text-muted">{service.summary}</p>
        <button type="button" onClick={() => dialog.current?.showModal()} className="mt-8 inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-accent hover:text-accent-strong">What&apos;s included <ArrowUpRight size={17} aria-hidden /></button>
      </article>
      <dialog ref={dialog} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }} className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-3xl border border-line bg-surface p-0 text-foreground shadow-2xl backdrop:bg-[#060713]/80">
        <div className="max-h-[85dvh] overflow-y-auto p-6 sm:p-9">
          <div className="mb-7 flex items-start justify-between gap-4"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-accent">Service details</p><h3 className="text-2xl font-semibold">{service.title}</h3></div><button onClick={() => dialog.current?.close()} aria-label="Close service details" type="button" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line hover:border-accent"><X size={19} aria-hidden /></button></div>
          <p className="text-sm leading-7 text-muted">{service.summary}</p>
          <ul className="mt-7 space-y-4">{service.details.map((detail) => <li key={detail} className="flex items-start gap-3 text-sm leading-6"><Check className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden /><span>{detail}</span></li>)}</ul>
          <a href="/contact" className="mt-9 inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-[#11101c] hover:bg-accent-strong hover:text-white">Discuss a project <ArrowUpRight size={16} aria-hidden /></a>
        </div>
      </dialog>
    </>
  );
}

export function Services() {
  return (
    <section className="py-24 sm:py-28">
      <Container>
        <SectionHeading eyebrow="03 / What I do" title="Skills that ship ideas." description="A mix of technical problem-solving and hands-on creativity, from the first prototype to the finishing touches." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">{services.map((service, index) => <ServiceCard key={service.title} service={service} index={index} />)}</div>
      </Container>
    </section>
  );
}
