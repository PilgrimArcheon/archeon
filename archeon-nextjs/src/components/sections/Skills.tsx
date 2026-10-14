import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { skillGroups } from "@/data/site";

export function Skills({ withContainer = true }: { withContainer?: boolean }) {
  const content = (
    <>
      <SectionHeading eyebrow="Toolkit" title="The tools behind the craft." description="My core development and design toolkit, based on my original portfolio." />
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {skillGroups.map((group) => (
          <div key={group.title} className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
            <h3 className="mb-6 text-xl font-semibold">{group.title}</h3>
            <ul className="grid gap-5 sm:grid-cols-2">
              {group.skills.map((skill) => <li key={skill.name} className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden /><div><p className="text-sm font-semibold text-foreground">{skill.name}</p><p className="mt-1 text-xs text-subtle">{skill.level}</p></div></li>)}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
  return <section className="py-24 sm:py-28">{withContainer ? <Container>{content}</Container> : content}</section>;
}
