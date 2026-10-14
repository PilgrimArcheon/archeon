import { ActionLink } from "@/components/ui/ActionLink";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { featuredProjects } from "@/data/site";

export function FeaturedProjects() {
  return (
    <section id="featured" className="py-24 sm:py-28">
      <Container>
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading eyebrow="01 / Selected work" title="Made to be played." description="A selection of projects spanning 2D worlds, 3D experiences, and gameplay systems." />
          <ActionLink href="/projects" variant="secondary" className="self-start whitespace-nowrap">All projects</ActionLink>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {featuredProjects.map((project, index) => <ProjectCard key={project.slug} project={project} priority={index === 0} large />)}
        </div>
      </Container>
    </section>
  );
}
