import { Container } from "@/components/ui/Container";
import { site } from "@/data/site";

export function Stats() {
  return (
    <div className="border-y border-line bg-surface/50 py-7 sm:py-9">
      <Container className="grid grid-cols-3 gap-3 text-center sm:gap-8">
        {site.stats.map((stat) => <div key={stat.label}>
          <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">{stat.value}</p>
          <p className="mt-2 text-xs leading-5 text-muted sm:text-sm">{stat.label}</p>
        </div>)}
      </Container>
    </div>
  );
}
