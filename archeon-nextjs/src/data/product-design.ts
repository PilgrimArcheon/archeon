/** Portfolio projects shown in Product Design and in the shared Projects directory.
 * Products have one canonical source of truth: src/data/products.ts.
 */
import { products, type ProductSlug } from "@/data/products";

export type ProductDesignProject = {
  slug: string;
  title: string;
  subtitle: string;
  category: "Web product" | "Mobile product" | "Brand & experience";
  summary: string;
  cover?: string;
  productSlug?: ProductSlug;
  gallery?: { src: string; alt: string }[];
  role?: string;
  overview?: string;
  challenge?: string;
  approach?: string;
  outcome?: string;
  liveUrl?: string;
  prototypeUrl?: string;
};

/** Featured product apps automatically appear in both portfolios and the project directory. */
const featuredProducts: ProductDesignProject[] = products.map((product) => ({
  slug: product.slug,
  productSlug: product.slug,
  title: product.name,
  subtitle: product.tagline,
  category: "Web product",
  summary: product.solution,
}));

/** Add other portfolio-specific case studies here when there is more work to show. */
const otherDesignProjects: ProductDesignProject[] = [];

export const productDesignProjects: ProductDesignProject[] = [
  ...featuredProducts,
  ...otherDesignProjects,
];

export function getProductDesignProject(slug: string) {
  return productDesignProjects.find((project) => project.slug === slug);
}
