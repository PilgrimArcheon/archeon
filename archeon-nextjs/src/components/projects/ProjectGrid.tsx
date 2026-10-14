"use client";

import { useMemo, useState } from "react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { cn } from "@/lib/utils";
import type { Project, ProjectCategory } from "@/types/content";

type Filter = "all" | ProjectCategory;
const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All projects" },
  { id: "2d", label: "2D games" },
  { id: "3d", label: "3D games" },
];

export function ProjectGrid({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = useMemo(() => projects.filter((project) => filter === "all" || project.category === filter), [filter, projects]);
  return (
    <div>
      <div role="group" aria-label="Filter projects" className="mb-8 flex flex-wrap gap-2.5">
        {filters.map(({ id, label }) => <button key={id} type="button" onClick={() => setFilter(id)} aria-pressed={filter === id} className={cn("min-h-11 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors", filter === id ? "border-accent bg-accent text-[#12101d]" : "border-line bg-surface text-muted hover:border-accent hover:text-foreground")}>{label}</button>)}
      </div>
      <p className="mb-5 text-xs font-medium uppercase tracking-[.18em] text-subtle" aria-live="polite">Showing {visible.length} {visible.length === 1 ? "project" : "projects"}</p>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((project) => <ProjectCard key={project.slug} project={project} />)}
      </div>
    </div>
  );
}
