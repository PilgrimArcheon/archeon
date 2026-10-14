import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Compass,
  Layers3,
  MousePointer2,
  MoveUpRight,
  PenTool,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { ProductProjectCard } from "@/components/product-design/ProductProjectCard";
import { productDesignProjects } from "@/data/product-design";

export const metadata: Metadata = {
  title: "Product Design Portfolio",
  description:
    "Product design at Archeon: interfaces, digital products, prototypes, and product experiences.",
};

const capabilities = [
  {
    number: "01",
    icon: Layers3,
    title: "Interface design",
    description:
      "Clear, purposeful interfaces shaped around what people need to do.",
  },
  {
    number: "02",
    icon: Compass,
    title: "Product thinking",
    description:
      "Defining the problem, mapping journeys, and finding the simplest useful path.",
  },
  {
    number: "03",
    icon: MousePointer2,
    title: "Prototyping",
    description: "Interactive ideas that can be explored, tested, and refined.",
  },
];

export default function ProductDesignPage() {
  return (
    <div className="pd-page">
      <section className="pd-hero" id="home" aria-labelledby="pd-title">
        <div className="container pd-hero__inner">
          <div className="pd-topline">
            <span>
              <span className="pd-pulse" /> ARCHEON / PORTFOLIO 02
            </span>
            <Link href="/" className="pd-minilink">
              BACK TO ARCHEON <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="pd-hero__art" aria-hidden="true">
            <div className="pd-hero__art-circle pd-hero__art-circle--one" />
            <div className="pd-hero__art-circle pd-hero__art-circle--two" />
            <div className="pd-hero__art-cross" />
            <div className="pd-hero__art-chip">
              <PenTool size={31} strokeWidth={1.25} />
            </div>
            <div className="pd-hero__art-code">001 / DESIGN SYSTEM</div>
          </div>
          <p className="pd-kicker">
            <ScanLine size={15} strokeWidth={1.5} /> A SECOND SIDE OF WHAT I
            BUILD
          </p>
          <h1 id="pd-title">
            Product <span>design.</span>
          </h1>
          <p className="pd-hero__intro">
            Useful products. Thoughtful interfaces.{" "}
            <span>Experiences that just make sense.</span>
          </p>
          <div className="pd-hero__lower">
            <p>
              A dedicated home for my product design work—solving everyday
              problems through useful digital products, considered journeys, and
              thoughtful interfaces.
            </p>
            <div className="pd-hero__links">
              <a
                href="#work"
                className="platform-button platform-button--primary"
              >
                Explore work <ArrowDownRight size={17} />
              </a>
              <Link
                href="/projects?category=product"
                className="platform-button"
              >
                Explore projects <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
          <a href="#about" className="pd-scroll">
            SCROLL TO EXPLORE <ArrowDownRight size={15} />
          </a>
        </div>
      </section>

      <section
        className="pd-section pd-about"
        id="about"
        aria-labelledby="pd-about-heading"
      >
        <div className="container pd-split">
          <div>
            <span className="pd-eyebrow">01 / A DIFFERENT PERSPECTIVE</span>
            <h2 id="pd-about-heading">
              Built for people<span>.</span>
              <br />
              Made with intention.
            </h2>
          </div>
          <div className="pd-about__aside">
            <Boxes size={23} strokeWidth={1.3} />
            <p>
              Product design is about making technology useful to people.
              Pocketline, Tackboard, and Gatherly bring that approach to money,
              productivity, and the moments we share.
            </p>
            <a href="#process" className="pd-text-link">
              See the focus areas <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      <section
        className="pd-section pd-process"
        id="process"
        aria-labelledby="pd-process-heading"
      >
        <div className="container">
          <div className="pd-section-header">
            <div>
              <span className="pd-eyebrow">02 / THE PRACTICE</span>
              <h2 id="pd-process-heading">
                From idea <span>to interaction.</span>
              </h2>
            </div>
            <p>Three disciplines that shape this part of Archeon.</p>
          </div>
          <div className="pd-capabilities">
            {capabilities.map(({ number, icon: Icon, title, description }) => (
              <article className="pd-capability" key={number}>
                <div className="pd-capability__top">
                  <span>{number} / FOCUS AREA</span>
                  <MoveUpRight size={17} />
                </div>
                <div className="pd-capability__icon">
                  <Icon size={23} strokeWidth={1.4} />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="pd-section pd-work"
        id="work"
        aria-labelledby="pd-work-heading"
      >
        <div className="container">
          <div className="pd-section-header">
            <div>
              <span className="pd-eyebrow">03 / SELECTED WORK</span>
              <h2 id="pd-work-heading">
                Product <span>showcases.</span>
              </h2>
            </div>
            <p>
              Products shaped around real-life needs. Explore each design,
              its user journey, and a full product showcase.
            </p>
          </div>
          <div className="pd-showcases">
            {productDesignProjects.map((project) => (
              <ProductProjectCard key={project.slug} project={project} />
            ))}
          </div>
          <div className="pd-work__links">
            <Link
              href="/products"
              className="platform-button platform-button--primary"
            >
              View all products <ArrowUpRight size={16} />
            </Link>
            <Link href="/projects?category=product" className="pd-text-link">
              Explore design projects <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section
        className="pd-section pd-contact"
        id="contact"
        aria-labelledby="pd-contact-heading"
      >
        <div className="container pd-split">
          <div>
            <span className="pd-eyebrow">04 / LET&apos;S CONNECT</span>
            <h2 id="pd-contact-heading">
              Have a product idea?
              <br />
              <span>Let&apos;s talk.</span>
            </h2>
          </div>
          <div className="pd-contact__right">
            <Sparkles size={21} strokeWidth={1.3} />
            <p>
              Whether it&apos;s a new concept or an existing experience that
              needs work, I&apos;m always up for a useful conversation.
            </p>
            <Link
              href="/contact"
              className="platform-button platform-button--primary"
            >
              Get in touch <ArrowUpRight size={17} />
            </Link>
            <Link href="/gamedev" className="pd-text-link">
              Explore Game Development <ArrowUpRight size={16} />
            </Link>
            <Link href="/" className="pd-text-link">
              Back to Archeon <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
