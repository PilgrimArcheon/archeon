import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Github,
  Linkedin,
} from "lucide-react";
import { site } from "@/data/site";

const highlights = [
  { value: "7+", label: "Years of experience" },
  { value: "20+", label: "Completed projects" },
  { value: "02", label: "Creative disciplines" },
] as const;

export function HomeAbout() {
  return (
    <section
      className="platform-about"
      id="about"
      aria-labelledby="platform-about-heading"
    >
      <div className="container">
        <div className="platform-about__heading">
          <span className="platform-eyebrow">
            <span className="platform-eyebrow__index">01 /</span> ABOUT ME
          </span>
          <Link href="/contact" className="platform-text-link">
            Let&apos;s connect <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="platform-about__grid">
          <div className="platform-about__portrait">
            <Image
              src="/images/about.png"
              alt="Pilgrim laughing outdoors"
              fill
              sizes="(max-width: 700px) 100vw, 40vw"
            />
          </div>
          <div className="platform-about__content">
            <span className="platform-eyebrow">HELLO, PILGRIM HERE!</span>
            <h2 id="platform-about-heading">
              Gameplay Programmer<span>.</span>
              <br />
              Product Designer<span>.</span>
            </h2>
            <p>
              I&apos;m Daniel Shontan; you can call my Pilgrim. I build digital experiences from both sides of the screen: the
              systems that make interactive worlds work, and the interfaces that
              help people use products with ease.
            </p>
            <p>
              From Gameplay and Real-time systems to Product thinking,
              prototyping and visual design, my work combines technical
              problem-solving with a focus on how things feel to use. I&apos;ve
              collaborated with studios, teams and clients across PC, mobile,
              web, multiplayer and AR/VR projects.
            </p>
            <div className="platform-about__stats">
              {highlights.map(({ value, label }) => (
                <div className="platform-about__stat" key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="platform-about__actions">
              <Link href="/gamedev" className="platform-button">
                Game Dev <ArrowRight size={16} />
              </Link>
              <Link href="/product-design" className="platform-button">
                Product Design <ArrowRight size={16} />
              </Link>
            </div>
            <div className="platform-about__socials">
              <a
                href={site.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin size={16} /> LinkedIn
              </a>
              <a
                href={site.socials.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github size={16} /> GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
