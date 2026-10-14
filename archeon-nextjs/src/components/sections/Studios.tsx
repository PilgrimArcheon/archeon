import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { studios } from "@/data/site";

export function Studios() {
  return (
    <section className="border-y border-line bg-surface/50 py-24 sm:py-28">
      <Container>
        <SectionHeading eyebrow="04 / Collaboration" title="Studios along the way." description="Teams, companies and studios featured in my original portfolio." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {studios.map((studio) => {
            const content = <><div className="relative mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-2"><Image src={studio.logo} alt={`${studio.name} logo`} fill sizes="64px" className="object-contain p-2" /></div><h3 className="pr-4 text-lg font-semibold text-foreground">{studio.name}</h3><p className="mt-2 text-xs leading-6 text-muted">{studio.description}</p>{studio.url && <ArrowUpRight size={18} className="absolute right-5 top-5 text-subtle transition-colors group-hover:text-accent" aria-hidden />}</>;
            const className = "group relative block min-h-48 rounded-2xl border border-line bg-background p-5 transition-colors hover:border-accent/60";
            return studio.url ? <a key={studio.name} href={studio.url} className={className} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${studio.name} website`}>{content}</a> : <div key={studio.name} className={className}>{content}</div>;
          })}
        </div>
      </Container>
    </section>
  );
}
