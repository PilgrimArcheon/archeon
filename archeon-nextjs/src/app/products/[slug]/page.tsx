import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  ExternalLink,
} from "lucide-react";
import { notFound } from "next/navigation";
import { products, findProduct } from "@/data/products";
import { ProductPreview } from "@/components/products/ProductPreview";
import styles from "../products.module.css";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() {
  return products.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);
  return product
    ? { title: `${product.name}`, description: product.solution }
    : { title: "Product not found" };
}

export default async function ProductCaseStudy({ params }: Props) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();
  const nextProduct =
    products[
      (products.findIndex((p) => p.slug === product.slug) + 1) % products.length
    ];
  return (
    <div className={styles.site}>
      <div className={styles.wrap}>
        <div className={styles.bar}>
          <Link href="/products" className={styles.back}>
            <ArrowLeft size={15} /> ALL PRODUCTS
          </Link>
          <span>{product.number} / 03 · PRODUCT SHOWCASE</span>
        </div>
        <section className={styles.detailHero}>
          <div className={styles.eyebrow}>
            {product.category} / PRODUCT DESIGN
          </div>
          <h1>
            {product.name}
            <span>.</span>
          </h1>
          <p className={styles.detailTagline}>{product.tagline}</p>
          <div className={styles.detailActions}>
            {product.demoUrl ? (
              <Link href={product.demoUrl} className={styles.primaryCta}>
                Open the web app <ExternalLink size={16} />
              </Link>
            ) : (
              <span className={styles.disabledCta}>
                <Clock3 size={16} /> Live demo in development
              </span>
            )}
            <Link
              href={`/app/support?source=${product.slug}`}
              className={styles.secondaryCta}
            >
              Product support <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>
        <div className={styles.detailPreview}>
          <ProductPreview slug={product.slug} large />
        </div>
        <div className={styles.caseMeta}>
          <span>
            STATUS{" "}
            <strong>
              {product.status === "live"
                ? "LIVE"
                : product.status === "mvp"
                  ? "WEB MVP"
                  : "IN DEVELOPMENT"}
            </strong>
          </span>
          <span>
            AUDIENCE <strong>{product.audience}</strong>
          </span>
          <span>
            DISCIPLINE <strong>PRODUCT DESIGN / WEB APPLICATION</strong>
          </span>
        </div>
        <section className={styles.storyGrid}>
          <div>
            <div className={styles.eyebrow}>01 / THE PROBLEM</div>
            <h2>What needs fixing?</h2>
            <p>{product.problem}</p>
          </div>
          <div>
            <div className={styles.eyebrow}>02 / THE IDEA</div>
            <h2>A simpler way forward.</h2>
            <p>{product.solution}</p>
          </div>
        </section>
        <section className={styles.structured}>
          <div className={styles.eyebrow}>03 / THE EXPERIENCE</div>
          <h2>From first visit to useful result.</h2>
          <div className={styles.steps}>
            {product.journey.map((step, index) => (
              <div key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{step}</p>
                <Check size={17} />
              </div>
            ))}
          </div>
        </section>
        <section className={styles.structured}>
          <div className={styles.eyebrow}>04 / PRODUCT SCREENS</div>
          <h2>Four essential screens.</h2>
          <div className={styles.screens}>
            {product.screens.map((screen, index) => (
              <div key={screen}>
                <span>SCREEN {String(index + 1).padStart(2, "0")}</span>
                <strong>{screen}</strong>
                <p>Interface preview</p>
              </div>
            ))}
          </div>
        </section>
        <section className={styles.insight}>
          <div className={styles.eyebrow}>DESIGN OPPORTUNITY</div>
          <h2>{product.standout}</h2>
          <p>
            {product.slug === "tackboard"
              ? "TackBoard supports browser and desktop sticky notes with a shared Archeon account and cloud synchronization. The showcase visuals use sample data."
              : "This showcase presents the product direction and interface previews using illustrative sample data. A demo will appear here when the web application is ready."}
          </p>
        </section>
        <div className={styles.closing}>
          <div>
            <div className={styles.eyebrow}>NEXT IN THE COLLECTION</div>
            <h2>{nextProduct.name}</h2>
            <p>{nextProduct.tagline}</p>
          </div>
          <Link
            href={`/products/${nextProduct.slug}`}
            className={styles.primaryCta}
          >
            Next product <ArrowRight size={17} />
          </Link>
        </div>
        <footer className={styles.footnote}>
          <Link href="/products">← BACK TO ALL PRODUCTS</Link>
          <Link href="/product-design#work">PRODUCT DESIGN PORTFOLIO</Link>
        </footer>
      </div>
    </div>
  );
}
