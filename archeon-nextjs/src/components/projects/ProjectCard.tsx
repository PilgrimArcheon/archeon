import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/types/content";
import { cn } from "@/lib/utils";

export function ProjectCard({ project, priority = false, large = false }: { project: Project; priority?: boolean; large?: boolean }) {
  return (
    <article className="group min-w-0 overflow-hidden rounded-3xl border border-line bg-surface transition-colors hover:border-accent/60">
      <Link href={`/projects/${project.slug}`} className="block" aria-label={`View ${project.title} project details`}>
        <div className={cn("relative overflow-hidden bg-surface-alt", large ? "aspect-[1.4]" : "aspect-[1.55]")}>
          <Image src={project.image} alt={`${project.title} project artwork`} fill sizes={large ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"} priority={priority} className="object-cover transition-transform duration-500 group-hover:scale-[1.045]" />
          <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-[#0e1020]/80 px-3 py-1.5 text-xs font-semibold tracking-wide text-white backdrop-blur-sm">{project.category.toUpperCase()} GAME</span>
          <span className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#131022] shadow-lg transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden><ArrowUpRight size={19} /></span>
        </div>
        <div className="p-5 sm:p-6">
          <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{project.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{project.description}</p>
        </div>
      </Link>
    </article>
  );
}
