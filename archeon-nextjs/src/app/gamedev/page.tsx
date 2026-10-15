import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Code2,
  Gamepad2,
  Layers3,
  MoveUpRight,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { projects, site } from "@/data/site";
import { ClassicStudios } from "@/components/classic/ClassicHome";

export const metadata: Metadata = {
  title: "Game Development Portfolio",
  description:
    "Gameplay programming, real-time systems, selected games and studios — the game development practice at Archeon.",
};

const practices = [
  {
    number: "01",
    icon: Gamepad2,
    title: "Gameplay Programming",
    description:
      "Designing and implementing responsive mechanics, player controls and the systems that make games feel right.",
    skills: "Unity / Unreal / PlayCanvas / Three js",
  },
  {
    number: "02",
    icon: Code2,
    title: "Systems & Architecture",
    description:
      "Building maintainable managers, multiplayer interactions, input systems and performance-minded game logic.",
    skills: "OOP / JavaScript / DSA",
  },
  {
    number: "03",
    icon: Layers3,
    title: "Visual Implementation",
    description:
      "Connecting gameplay with interfaces, animation, 2D/3D assets and in-engine visual feedback.",
    skills: "UI / Photoshop / Blender / Animation",
  },
];

const featuredSlugs = ["midnight-dreams", "redshield", "games4africa"] as const;
const featuredGames = featuredSlugs
  .map((slug) => projects.find((project) => project.slug === slug))
  .filter((project): project is (typeof projects)[number] => Boolean(project));

export default function GameDevPage() {
  return (
    <div className="pd-page gd-page">
      <section className="pd-hero gd-hero" id="home" aria-labelledby="gd-title">
        <div className="container pd-hero__inner">
          <div className="pd-topline">
            <span>
              <span className="pd-pulse" /> ARCHEON / GAME DEV
            </span>
          </div>
          <div className="pd-hero__art" aria-hidden="true">
            <div className="pd-hero__art-circle pd-hero__art-circle--one" />
            <div className="pd-hero__art-circle pd-hero__art-circle--two" />
            <div className="pd-hero__art-cross" />
            <div className="pd-hero__art-chip">
              <Gamepad2 size={34} strokeWidth={1.2} />
            </div>
            <div className="pd-hero__art-code">001 / REAL-TIME WORLDS</div>
          </div>
          <p className="pd-kicker">
            <ScanLine size={15} strokeWidth={1.5} /> THE INTERACTIVE SIDE OF
            WHAT I BUILD
          </p>
          <h1 id="gd-title">
            Game <span>development.</span>
          </h1>
          <p className="pd-hero__intro">
            Mechanics that feel right. Systems that hold up.{" "}
            <span>Worlds worth exploring.</span>
          </p>
          <div className="pd-hero__lower">
            <p>
              I&apos;m Pilgrim, a gameplay programmer working across interactive
              experiences, from the first prototype to playable builds. My work
              brings programming, game systems, and visual implementation
              together.
            </p>
            <div className="pd-hero__links">
              <a
                href="#skills"
                className="platform-button platform-button--primary"
              >
                Explore the practice <ArrowDownRight size={17} />
              </a>
              <a href={site.resume} download className="platform-button">
                Download CV <ArrowDownRight size={17} />
              </a>
            </div>
          </div>
          <a href="#skills" className="pd-scroll">
            SCROLL TO EXPLORE <ArrowDownRight size={15} />
          </a>
        </div>
      </section>

      <section
        className="pd-section pd-process"
        id="skills"
        aria-labelledby="gd-skills-heading"
      >
        <div className="container">
          <div className="pd-section-header">
            <div>
              <span className="pd-eyebrow">01 / THE PRACTICE</span>
              <h2 id="gd-skills-heading">
                Building the <span>playable.</span>
              </h2>
            </div>
            <p>
              The technical and creative disciplines behind my game development
              work.
            </p>
          </div>
          <div className="pd-capabilities">
            {practices.map(
              ({ number, icon: Icon, title, description, skills }) => (
                <article className="pd-capability gd-practice" key={number}>
                  <div className="pd-capability__top">
                    <span>{number} / FOCUS AREA</span>
                    <MoveUpRight size={17} />
                  </div>
                  <div className="pd-capability__icon">
                    <Icon size={23} strokeWidth={1.4} />
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <span className="gd-practice__skills">{skills}</span>
                </article>
              ),
            )}
          </div>
        </div>
      </section>

      <section
        className="pd-section pd-work"
        id="work"
        aria-labelledby="gd-work-heading"
      >
        <div className="container">
          <div className="pd-section-header">
            <div>
              <span className="pd-eyebrow">02 / SELECTED WORK</span>
              <h2 id="gd-work-heading">
                Games & <span>experiences.</span>
              </h2>
            </div>
            <p>
              Three featured projects from the portfolio. Explore the demos or
              dig into the work behind them.
            </p>
          </div>
          <div className="pd-showcases">
            {featuredGames.map((project, index) => (
              <article className="pd-case gd-case" key={project.slug}>
                <Link
                  href={`/projects/${project.slug}`}
                  className="pd-case__media"
                  aria-label={`Explore ${project.title}`}
                >
                  <Image
                    src={project.image}
                    alt={`${project.title} project preview`}
                    fill
                    sizes="(max-width: 620px) 100vw, (max-width: 900px) 50vw, 33vw"
                  />
                </Link>
                <div className="pd-case__body">
                  <span>
                    {String(index + 1).padStart(2, "0")} / GAME DEVELOPMENT
                  </span>
                  <ArrowUpRight size={17} />
                </div>
                <h3>
                  <Link href={`/projects/${project.slug}`}>
                    {project.title}
                  </Link>
                </h3>
                <p>{project.description}</p>
                <div className="gd-case__links">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="pd-text-link"
                  >
                    View project <ArrowRight size={15} />
                  </Link>
                  <a
                    className="pd-text-link"
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {project.action} <ArrowUpRight size={15} />
                  </a>
                </div>
              </article>
            ))}
          </div>
          <div className="pd-work__links">
            <Link href="/projects?category=gamedev" className="pd-text-link">
              Explore all Game Dev projects <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section
        className="pd-section gd-studios"
        id="jobs"
        aria-labelledby="gd-studios-heading"
      >
        <div className="container">
          <div className="pd-section-header">
            <div>
              <span className="pd-eyebrow">03 / COLLABORATIONS</span>
              <h2 id="gd-studios-heading">
                Studios <span>worked with.</span>
              </h2>
            </div>
            <p>
              Teams and studios I&apos;ve worked alongside on interactive experiences
              and digital projects.
            </p>
          </div>
          <div className="original-site gd-studios__carousel">
            <ClassicStudios />
          </div>
        </div>
      </section>

      <section
        className="pd-section pd-contact"
        id="contact"
        aria-labelledby="gd-contact-heading"
      >
        <div className="container pd-split">
          <div>
            <span className="pd-eyebrow">04 / LET&apos;S BUILD</span>
            <h2 id="gd-contact-heading">
              Game Dev idea?
              <br />
              <span>Let&apos;s talk.</span>
            </h2>
          </div>
          <div className="pd-contact__right">
            <Sparkles size={21} strokeWidth={1.3} />
            <p>
              Need a gameplay programmer, a prototype, or someone to help bring
              a system to life? Tell me what you&apos;re building.
            </p>
            <Link
              href="/contact"
              className="platform-button platform-button--primary"
            >
              Get in touch <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
