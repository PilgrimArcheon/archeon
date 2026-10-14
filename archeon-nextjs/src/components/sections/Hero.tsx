import Image from "next/image";
import { ArrowDown, ArrowRight, Download, Github, Linkedin } from "lucide-react";
import { ActionLink } from "@/components/ui/ActionLink";
import { Container } from "@/components/ui/Container";
import { site } from "@/data/site";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pb-20 pt-14 sm:pt-20 lg:pb-28 lg:pt-24" aria-labelledby="hero-title">
      <div className="pointer-events-none absolute inset-0 hero-grid" aria-hidden />
      <div className="pointer-events-none absolute -right-32 -top-10 h-[38rem] w-[38rem] orb" aria-hidden />
      <Container className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-14">
        <div className="animate-rise order-1">
          <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[.14em] text-accent">
            <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" aria-hidden />
            Welcome to my creative corner
          </div>
          <p className="text-xl font-medium text-muted sm:text-2xl">Heyo! I&apos;m <span className="text-accent">Pilgrim.</span></p>
          <h1 id="hero-title" className="mt-4 max-w-3xl text-[clamp(3.7rem,8vw,7.4rem)] font-semibold leading-[.98] tracking-[-.075em] text-foreground">
            I build <span className="gradient-text">games</span><span className="text-accent">.</span><br />And the systems behind them<span className="text-accent">.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-muted sm:text-lg">Gameplay programmer and visual designer. Turning ideas into responsive mechanics, playful worlds, and memorable experiences.</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <ActionLink href="/projects" icon={false}>Explore my work <ArrowRight size={17} aria-hidden /></ActionLink>
            <ActionLink href={site.resume} variant="secondary" download icon={false}>Download CV <Download size={17} aria-hidden /></ActionLink>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-5 text-sm text-muted">
            <a className="inline-flex items-center gap-2 hover:text-accent" href={site.socials.github} target="_blank" rel="noopener noreferrer"><Github size={19} aria-hidden /> GitHub</a>
            <a className="inline-flex items-center gap-2 hover:text-accent" href={site.socials.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin size={19} aria-hidden /> LinkedIn</a>
            <a className="inline-flex items-center gap-2 hover:text-accent" href="#featured"><ArrowDown size={18} aria-hidden /> Scroll to explore</a>
          </div>
        </div>
        <div className="order-2 mx-auto w-full max-w-[380px] sm:max-w-[440px] lg:max-w-none">
          <div className="relative aspect-[.88] overflow-hidden rounded-[2.5rem] border border-accent/25 bg-[radial-gradient(ellipse_at_50%_28%,#6353ad_0%,#262139_45%,#101320_80%)]">
            <div className="absolute inset-5 rounded-[2rem] border border-white/10" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-[#101320]/80 to-transparent" aria-hidden />
            <Image src="/images/perfil.png" alt="Portrait of Shontan Daniel, also known as Pilgrim" fill priority sizes="(max-width: 1024px) 440px, 45vw" className="object-contain object-bottom drop-shadow-2xl" />
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-white/20 bg-[#101322]/75 p-4 text-white backdrop-blur-md sm:bottom-7 sm:left-7 sm:right-7">
              <div><p className="text-[11px] uppercase tracking-[.16em] text-[#c7badf]">Player one</p><p className="mt-1 text-lg font-semibold">Pilgrim / Archeon</p></div>
              <span className="rounded-xl bg-accent px-3 py-2 text-xs font-bold text-[#11101c]">GAME DEV</span>
            </div>
          </div>
          <div className="absolute right-0 top-6 hidden rotate-6 rounded-xl border border-accent/30 bg-surface px-4 py-3 text-xs font-semibold text-accent shadow-xl xl:block" aria-hidden>Code × Creativity ✳</div>
        </div>
      </Container>
    </section>
  );
}
