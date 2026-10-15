import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getProductDesignProject, productDesignProjects } from "@/data/product-design";

type Props = { params: Promise<{ slug: string }> };

/** The route exists, but nothing is published until actual product details arrive. */
export function generateStaticParams() {
  return productDesignProjects.map(({ slug }) => ({ slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProductDesignProject(slug);
  if (!project) return { title: "Product not found" };
  return { title: `${project.title}`, description: project.summary, ...(project.cover ? { openGraph: { images: [project.cover] } } : {}) };
}

export default async function ProductCaseStudy({ params }: Props) {
  const { slug } = await params;
  const product = getProductDesignProject(slug);
  if (!product) notFound();
  if (product.productSlug) redirect(`/products/${product.productSlug}`);
  const detailSections = [
    { title: "Overview", text: product.overview },
    { title: "The challenge", text: product.challenge },
    { title: "Approach", text: product.approach },
    { title: "Outcome", text: product.outcome },
  ].filter((item): item is { title: string; text: string } => Boolean(item.text));

  return <article className="pd-page pd-detail">
    <header className="pd-detail__header container"><Link href="/product-design#work" className="pd-minilink"><ArrowLeft size={15}/> ALL PRODUCT DESIGN WORK</Link><span className="pd-eyebrow">CASE STUDY / {product.category.toUpperCase()}</span><h1>{product.title}<span>.</span></h1><p>{product.subtitle}</p>{product.role && <p className="pd-detail__role">ROLE / {product.role}</p>}</header>
    <div className="container">{product.cover && <div className="pd-detail__cover"><Image src={product.cover} alt={product.title} fill sizes="(max-width: 1000px) 100vw, 1100px" priority/></div>}
      <div className="pd-detail__sections">{detailSections.map(({ title, text }, index) => <section key={title}><span className="pd-eyebrow">{String(index + 1).padStart(2,"0")} / {title.toUpperCase()}</span><h2>{title}</h2><p>{text}</p></section>)}</div>
      {product.gallery?.length ? <div className="pd-detail__gallery">{product.gallery.map(image => <div className="pd-detail__gallery-image" key={image.src}><Image src={image.src} alt={image.alt} fill sizes="(max-width: 700px) 100vw, 50vw"/></div>)}</div> : null}
      <div className="pd-detail__actions">{product.liveUrl && <a href={product.liveUrl} target="_blank" rel="noopener noreferrer" className="platform-button platform-button--primary">View live product <ArrowUpRight size={17}/></a>}{product.prototypeUrl && <a href={product.prototypeUrl} target="_blank" rel="noopener noreferrer" className="platform-button">Open prototype <ArrowUpRight size={17}/></a>}</div>
      <Link href="/product-design#work" className="pd-text-link"><ArrowLeft size={16}/> Back to product design</Link>
    </div>
  </article>;
}
