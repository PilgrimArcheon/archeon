import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProductPreview } from "@/components/products/ProductPreview";
import type { ProductDesignProject } from "@/data/product-design";

/** One card format for product apps and future standalone design case studies. */
export function ProductProjectCard({ project }: { project: ProductDesignProject }) {
  const href = project.productSlug
    ? `/products/${project.productSlug}`
    : `/product-design/${project.slug}`;

  return (
    <Link href={href} className="pd-case" aria-label={`Explore ${project.title}`}>
      <div className="pd-case__media">
        {project.productSlug ? (
          <ProductPreview slug={project.productSlug} />
        ) : project.cover ? (
          <Image src={project.cover} alt={`${project.title} design showcase`} fill sizes="(max-width: 700px) 100vw, 50vw" />
        ) : null}
      </div>
      <div className="pd-case__body">
        <span className="pd-case__label">{project.category}</span>
        <ArrowUpRight size={19} aria-hidden="true" />
      </div>
      <h3>{project.title}</h3>
      <p>{project.subtitle}</p>
      <span className="pd-case__cta">Explore product <ArrowUpRight size={15} aria-hidden="true" /></span>
    </Link>
  );
}
