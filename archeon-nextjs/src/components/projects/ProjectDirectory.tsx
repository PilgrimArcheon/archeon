"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Gamepad2, PenTool } from "lucide-react";
import { projects } from "@/data/site";
import { productDesignProjects } from "@/data/product-design";
import { ProductProjectCard } from "@/components/product-design/ProductProjectCard";

type ProjectFilter = "gamedev" | "product";

export function ProjectDirectory({ initialFilter = "gamedev" }: { initialFilter?: ProjectFilter }) {
  const [filter, setFilter] = useState<ProjectFilter>(initialFilter);
  const gameVisible = filter === "gamedev";
  const designVisible = filter === "product";
  const total = projects.length + productDesignProjects.length;
  return <div className="directory-page">
    <section className="directory-hero"><div className="container">
      <div className="directory-hero__top"><span className="pd-eyebrow">ARCHEON / WORK INDEX</span><span className="pd-eyebrow">{String(total).padStart(2,"0")} PROJECTS</span></div>
      <h1>Selected <span>projects.</span></h1>
      <div className="directory-hero__lower"><p>A shared directory of work from my Game Development and Product Design portfolios. Select a discipline to explore its projects and case studies.</p><div className="directory-hero__links"><Link href="/gamedev" className="pd-text-link">Game Dev Portfolio <ArrowUpRight size={16}/></Link><Link href="/product-design" className="pd-text-link">Product Design Portfolio <ArrowUpRight size={16}/></Link></div></div>
    </div></section>
    <section className="directory-content"><div className="container">
      <div className="directory-controls"><span className="pd-eyebrow">01 / FILTER BY DISCIPLINE</span><div className="directory-tabs" role="group" aria-label="Filter projects by portfolio">
        {([{ id:"gamedev", label:"Game development", count:projects.length },{ id:"product", label:"Product design", count:productDesignProjects.length }] as const).map(tab => <button key={tab.id} type="button" className={filter === tab.id ? "directory-tab directory-tab--active" : "directory-tab"} aria-pressed={filter === tab.id} onClick={() => setFilter(tab.id)}>{tab.label}<span>{String(tab.count).padStart(2,"0")}</span></button>)}
      </div></div>
      {gameVisible && <div className="directory-group" aria-live="polite"><div className="directory-group__head"><div><span className="pd-eyebrow">GAME DEVELOPMENT / {String(projects.length).padStart(2,"0")}</span><h2><Gamepad2 size={26} strokeWidth={1.4}/> Interactive work.</h2></div><Link href="/gamedev#work" className="pd-text-link">Explore portfolio <ArrowUpRight size={16}/></Link></div>
        <div className="directory-grid">{projects.map(project => <article className="directory-card" key={project.slug}><Link href={`/projects/${project.slug}`} className="directory-card__image" aria-label={`Read about ${project.title}`}><Image src={project.image} alt={`${project.title} preview`} fill sizes="(max-width: 630px) 100vw, (max-width: 1000px) 50vw, 33vw"/></Link><div className="directory-card__label"><span>{project.category.toUpperCase()} / GAME DEVELOPMENT</span><ArrowUpRight size={17}/></div><h3><Link href={`/projects/${project.slug}`}>{project.title}</Link></h3><p>{project.description}</p><div className="directory-card__links"><Link href={`/projects/${project.slug}`}>View project <ArrowRight size={16}/></Link><a href={project.url} target="_blank" rel="noopener noreferrer">{project.action} <ArrowUpRight size={16}/></a></div></article>)}</div>
      </div>}
      {designVisible && <div className="directory-group" aria-live="polite"><div className="directory-group__head"><div><span className="pd-eyebrow">PRODUCT DESIGN / {String(productDesignProjects.length).padStart(2,"0")}</span><h2><PenTool size={26} strokeWidth={1.4}/> Designed experiences.</h2></div><Link href="/product-design#work" className="pd-text-link">Explore portfolio <ArrowUpRight size={16}/></Link></div>
        <div className="directory-grid directory-grid--product">{productDesignProjects.map(project => <ProductProjectCard key={project.slug} project={project}/>)}</div>
        <div className="pd-work__links"><Link href="/products" className="pd-text-link">View all products <ArrowUpRight size={16}/></Link></div>
      </div>}
    </div></section>
  </div>;
}
