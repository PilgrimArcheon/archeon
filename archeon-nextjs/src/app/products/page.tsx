import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ArrowRight, Layers3 } from "lucide-react";
import { products } from "@/data/products";
import { ProductPreview } from "@/components/products/ProductPreview";
import styles from "./products.module.css";

export const metadata: Metadata = {
  title: "Products — Archeon",
  description: "Pocketline, Tackboard and Gatherly: three digital products for money, productivity and community. Browse design previews and user journeys.",
};

export default function ProductsPage() {
  return <div className={styles.site}>
    <div className={styles.wrap}>
      <div className={styles.bar}><Link href="/product-design#work" className={styles.back}><ArrowLeft size={15}/> PRODUCT DESIGN</Link><span>INDEPENDENT PRODUCT LAB</span></div>
      <section className={styles.hero}>
        <div className={styles.eyebrow}>01 / PRODUCT DESIGN</div>
        <h1>Products for<br/><span>real life.</span></h1>
        <p>Thoughtfully designed digital products for everyday life. Explore how each one helps people manage money, focus on what matters, or bring communities together.</p>
        <div className={styles.heroMeta}><Layers3 size={16}/> 03 / FEATURED PRODUCTS <span>·</span> A GROWING COLLECTION OF REAL APPS</div>
      </section>
      <section className={styles.gallery} aria-labelledby="collection-heading">
        <div className={styles.sectionTitle}><div><div className={styles.eyebrow}>THE COLLECTION</div><h2 id="collection-heading">Explore the products</h2></div><span>01—03 / PRODUCT COLLECTION</span></div>
        <div className={styles.grid}>{products.map((product) => <article key={product.slug} className={styles.card}>
          <Link className={styles.previewLink} href={`/products/${product.slug}`} aria-label={`Explore ${product.name}`}><ProductPreview slug={product.slug}/></Link>
          <div className={styles.cardInfo}><div className={styles.cardMeta}>{product.number} / {product.category} <span>PRODUCT</span></div>
            <h3>{product.name}</h3><p className={styles.tagline}>{product.tagline}</p><p>{product.solution}</p>
            <Link className={styles.cardLink} href={`/products/${product.slug}`}>Explore product <ArrowUpRight size={16}/></Link>
          </div>
        </article>)}</div>
      </section>
      <div className={styles.closing}><div><div className={styles.eyebrow}>HAVE AN IDEA?</div><h2>Let&apos;s make something useful.</h2><p>From product strategy and interface design to a working prototype.</p></div><Link href="/contact" className={styles.primaryCta}>Start a conversation <ArrowRight size={16}/></Link></div>
      <footer className={styles.footnote}><Link href="/product-design#work">← PRODUCT DESIGN</Link><span>Previews use illustrative sample data. Live demos will appear when ready.</span></footer>
    </div>
  </div>;
}
