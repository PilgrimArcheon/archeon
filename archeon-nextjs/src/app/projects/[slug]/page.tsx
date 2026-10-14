import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getProject, projects } from "@/data/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Project not found" };
  return { title: project.title, description: project.description, openGraph: { images: [project.image] } };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return (
    <div className="original-site main">
      <section className="section simple-page">
        <span className="section__subtitle">{project.category.toUpperCase()} Project</span>
        <h1 className="section__title">{project.title}</h1>
        <div className="container" style={{ maxWidth: 750 }}>
          <Link href="/projects" className="simple-page-link"><ArrowLeft size={16} aria-hidden /> All Projects</Link>
          <div className="simple-page-card" style={{ marginTop: "1.5rem" }}>
            <Image className="simple-page-image" src={project.image} alt={`${project.title} project artwork`} width={700} height={440} priority />
            <p className="simple-page-copy" style={{ marginBottom: "1.5rem" }}>{project.description}</p>
            <a href={project.url} target="_blank" rel="noopener noreferrer" className="button">{project.action} <ArrowRight size={16} aria-hidden style={{ display: "inline-block", verticalAlign: "middle" }} /></a>
          </div>
        </div>
      </section>
    </div>
  );
}
