import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Blocks,
  Code2,
  Gamepad2,
  Github,
  Mail,
  MoveUpRight,
  PenTool,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { site } from "@/data/site";
import { HomeAbout } from "@/components/platform/HomeAbout";

const destinations = [
  {
    num: "01",
    icon: Gamepad2,
    category: "SPECIALTY",
    title: "Game Development",
    detail:
      "Interactive worlds, real-time systems, gameplay engineering, and visual storytelling.",
    href: "/gamedev",
    action: "Explore portfolio",
  },
  {
    num: "02",
    icon: PenTool,
    category: "SPECIALTY",
    title: "Product Design",
    detail:
      "Purposeful digital products, thoughtful interfaces, user journeys, and prototypes.",
    href: "/product-design",
    action: "Explore portfolio",
  },
  {
    num: "03",
    icon: Code2,
    category: "THE TOOLBOX",
    title: "Apps & Tools",
    detail:
      "Useful little products, experiments, and utilities. Built to solve real problems.",
    href: "/app",
    action: "Open the toolbox",
  },
] as const;

export function PlatformHome() {
  return (
    <div className="platform-home" id="home">
      <section className="platform-hero" aria-labelledby="platform-hero-title">
        <div className="platform-hero__lines" aria-hidden="true" />
        <div className="platform-hero__inner container">
          <div className="platform-hero__topline">
            <span className="platform-status">
              <span className="platform-status__light" /> INDEPENDENT CREATIVE
              PRACTICE
            </span>
            <span className="platform-hero__index">
              EST. BY PILGRIM <span className="platform-hero__slash">/</span>{" "}
              001
            </span>
          </div>
          <div className="platform-hero__composition">
            <div className="platform-orbit" aria-hidden="true">
              <div className="platform-orbit__outer" />
              <div className="platform-orbit__middle" />
              <div className="platform-orbit__inner" />
              <div className="platform-orbit__cross platform-orbit__cross--h" />
              <div className="platform-orbit__cross platform-orbit__cross--v" />
              <div className="platform-orbit__core">
                <Blocks size={26} strokeWidth={1} />
              </div>
              <span className="platform-orbit__node platform-orbit__node--one" />
              <span className="platform-orbit__node platform-orbit__node--two" />
            </div>
            <div className="platform-hero__wordmark-wrap">
              <p className="platform-hero__eyebrow">
                <ScanLine size={15} strokeWidth={1.5} aria-hidden /> IDEAS /
                CODE / EXPERIENCE
              </p>
              <h1 id="platform-hero-title" className="platform-hero__wordmark">
                ARCHEON<span className="platform-hero__period">.</span>
              </h1>
              <div className="platform-hero__baseline" />
              <div className="platform-hero__under">
                <span>DESIGNING WHAT&apos;S NEXT</span>
                <span>BUILDING WHAT MATTERS</span>
              </div>
            </div>
          </div>
          <div className="platform-hero__bottom">
            <div>
              <p className="platform-hero__lead">
                A home for everything I create<span>.</span>
              </p>
              <p className="platform-hero__copy">
                Heyo, I&apos;m Pilgrim! A Gameplay Programmer and Product
                Designer. I create engaging interactive systems, considered
                digital products, and practical tools that connect how things
                work with how they feel.
              </p>
            </div>
            <div className="platform-hero__actions">
              <Link
                href="/gamedev"
                className="platform-button platform-button--primary"
              >
                Game Dev <ArrowUpRight size={17} />
              </Link>
              <Link href="/product-design" className="platform-button">
                Product Design <ArrowRight size={17} />
              </Link>
              <Link href="/projects" className="platform-button">
                Explore projects <ArrowRight size={17} />
              </Link>
              <Link href="/app" className="platform-button">
                Discover apps <ArrowRight size={17} />
              </Link>
            </div>
          </div>
          <a href="#explore" className="platform-hero__scroll">
            SCROLL TO EXPLORE <ArrowDownRight size={16} />
          </a>
        </div>
      </section>

      <HomeAbout />

      <section
        className="platform-explore"
        id="explore"
        aria-labelledby="explore-title"
      >
        <div className="container">
          <div className="platform-section-head">
            <div>
              <span className="platform-eyebrow">
                <span className="platform-eyebrow__index">02 /</span> AREAS OF
                WORK
              </span>
              <h2 id="explore-title">
                One person. <span>Many directions.</span>
              </h2>
            </div>
            <p>
              A growing collection of things I make, the things I&apos;m
              learning, and the tools I put into the world.
            </p>
          </div>
          <div className="platform-areas">
            {destinations.map(
              ({ num, icon: Icon, category, title, detail, href, action }) => (
                <Link href={href} className="platform-area" key={num}>
                  <div className="platform-area__top">
                    <span>
                      {num} / {category}
                    </span>
                    <ArrowUpRight size={20} strokeWidth={1.5} />
                  </div>
                  <div className="platform-area__icon">
                    <Icon size={24} strokeWidth={1.25} />
                  </div>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                  <div className="platform-area__bottom">
                    <span>{action}</span>
                    <MoveUpRight size={16} />
                  </div>
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="platform-note" aria-labelledby="platform-note-title">
        <div className="container platform-note__inner">
          <div>
            <span className="platform-eyebrow">
              <span className="platform-eyebrow__index">03 /</span> BEYOND THE
              PORTFOLIO
            </span>
            <h2 id="platform-note-title">
              Always exploring<span>.</span>
              <br />
              <span>Always building.</span>
            </h2>
          </div>
          <div className="platform-note__aside">
            <Sparkles size={21} strokeWidth={1.3} />
            <p>
              Beyond game development and product design, I build tools, explore
              emerging ideas, and connect technology with useful everyday
              experiences.
            </p>
            <a
              href={site.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              className="platform-text-link"
            >
              Follow what I&apos;m making <Github size={17} />
            </a>
          </div>
        </div>
      </section>

      <section
        className="platform-contact"
        aria-labelledby="platform-contact-title"
      >
        <div className="container platform-contact__inner">
          <div>
            <span className="platform-eyebrow">
              <span className="platform-eyebrow__index">04 /</span> HAVE AN
              IDEA?
            </span>
            <h2 id="platform-contact-title">
              Let&apos;s make
              <br />
              <span>something happen.</span>
            </h2>
          </div>
          <div className="platform-contact__actions">
            <Link
              href="/contact"
              className="platform-button platform-button--primary"
            >
              Get in touch <ArrowUpRight size={18} />
            </Link>
            <a
              href={`mailto:${site.email}`}
              className="platform-contact__email"
            >
              <Mail size={17} /> {site.email}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
