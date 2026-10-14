import type { Metadata } from "next";
import { ProjectDirectory } from "@/components/projects/ProjectDirectory";

export const metadata: Metadata = {
  title: "Explore Projects",
  description: "Browse work from both Archeon portfolios: Game Development and Product Design.",
};

type Props = { searchParams: Promise<{ category?: string }> };
export default async function ProjectsPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const initialFilter = category === "product" ? "product" : "gamedev";
  return <ProjectDirectory initialFilter={initialFilter} />;
}
