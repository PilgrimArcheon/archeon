import Image from "next/image";
import { ArrowUpRight, Layers3, PencilRuler } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ActionLink } from "@/components/ui/ActionLink";
import { site } from "@/data/site";

export function AboutPreview() {
  return (
    <section id="about" className="bg-surface/50 py-24 sm:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-[.87fr_1.13fr] lg:gap-20">
        <div className="relative">
          <div className="relative mx-auto aspect-[.97] w-full max-w-md overflow-hidden rounded-[2rem] border border-line bg-surface-alt">
            <Image src="/images/about.png" alt="Shontan Daniel outside in a casual portrait" fill sizes="(max-width: 1024px) 440px, 45vw" className="object-cover" />
          </div>
          <div className="absolute -bottom-5 -right-2 hidden items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-2xl sm:flex lg:-right-5"><span className="rounded-xl bg-accent/15 p-3 text-accent"><Layers3 size={21} /></span><div><p className="text-sm font-bold">Game systems</p><p className="text-xs text-muted">Design → Develop → Play</p></div></div>
        </div>
        <div>
          <SectionHeading eyebrow="02 / The person behind the code" title="Where logic meets imagination." />
          <p className="mt-7 text-base leading-8 text-muted">{site.about}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface p-5"><PencilRuler size={24} className="text-accent" aria-hidden /><h3 className="mt-4 font-semibold">Design-minded</h3><p className="mt-2 text-sm leading-6 text-muted">From concepts and visual direction to interfaces and player experience.</p></div>
            <div className="rounded-2xl border border-line bg-surface p-5"><Layers3 size={24} className="text-accent" aria-hidden /><h3 className="mt-4 font-semibold">Systems-focused</h3><p className="mt-2 text-sm leading-6 text-muted">Building mechanics and tools that support the bigger picture.</p></div>
          </div>
          <div className="mt-8"><ActionLink href="/about" icon={false}>A little more about me <ArrowUpRight size={16} /></ActionLink></div>
        </div>
      </Container>
    </section>
  );
}
