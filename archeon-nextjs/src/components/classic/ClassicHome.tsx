"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from "react";
import {
  ArrowRight, Award, BadgeCheck, BriefcaseBusiness, Check, ChevronRight,
  Github, Headset, Linkedin, Mail, MessageCircle, Mouse, X,
} from "lucide-react";
import { classicServices, classicStudios } from "@/data/classic";
import { projects, allProjectsUrl, site } from "@/data/site";
import { ClassicContactForm } from "@/components/classic/ClassicContactForm";

type Filter = "all" | "2d" | "3d";

const projectImageDimensions: Record<string, { width: number; height: number }> = {
  "drivingSim.jpg": { width: 640, height: 420 },
  "dent_snl.jpg": { width: 640, height: 420 },
  "g4a-graphics.png": { width: 1024, height: 500 },
  "dayZero.png": { width: 1080, height: 600 },
  "games4Africa.jpg": { width: 6870, height: 4721 },
  "microlab.PNG": { width: 159, height: 166 },
  "jobs2.png": { width: 128, height: 128 },
  "about.jpg": { width: 899, height: 899 },
  "multiplayer.jpg": { width: 640, height: 420 },
  "midnightDreams.png": { width: 1920, height: 1080 },
  "redshield.jpg": { width: 640, height: 420 },
  "2dGameUI.jpg": { width: 640, height: 420 },
  "magesDungeon.jpg": { width: 640, height: 420 },
  "jobs5.png": { width: 128, height: 128 },
  "jobs4.png": { width: 128, height: 128 },
  "Daniel_dp.png": { width: 1024, height: 1024 },
  "fnf_rts.jpg": { width: 640, height: 420 },
  "takeshiMaze.jpg": { width: 640, height: 420 },
  "jobs6.png": { width: 450, height: 450 },
  "endlessRanger.jpg": { width: 1080, height: 360 },
  "midnightDreams.jpg": { width: 640, height: 420 },
  "elsWhere.jpg": { width: 640, height: 420 },
  "perfil.png": { width: 840, height: 1455 },
  "jobs1.png": { width: 128, height: 128 },
  "jobs3.png": { width: 128, height: 128 },
  "jobs7.png": { width: 66, height: 66 },
  "og-cover.png": { width: 1200, height: 630 },
  "play-rumble.png": { width: 1920, height: 1080 },
  "favicon.png": { width: 33, height: 33 },
};

const skillGroups = [
  {
    title: "Gameplay Programming",
    left: [{ name: "Unity", level: "Advanced" }, { name: "C#", level: "Advanced" }, { name: "OOP", level: "Intermediate" }],
    right: [{ name: "PlayCanvas", level: "Intermediate" }, { name: "JavaScript", level: "Intermediate" }, { name: "DSA", level: "Intermediate" }],
  },
  {
    title: "Visual Design",
    left: [{ name: "Illustrator", level: "Advanced" }, { name: "Photoshop", level: "Intermediate" }, { name: "Blender3D", level: "Intermediate" }],
    right: [{ name: "UI", level: "Intermediate" }, { name: "Wireframe", level: "Basic" }, { name: "Rigging & Animation", level: "Basic" }],
  },
] as const;

function SectionTitle({ subtitle, title }: { subtitle: string; title: string }) {
  return <><span className="section__subtitle">{subtitle}</span><h2 className="section__title">{title}</h2></>;
}

function Hero() {
  return (
    <section className="home section" id="home">
      <div className="home__container container grid">
        <div className="home__data">
          <span className="home__greeting">Heyo!</span>
          <h1 className="home__name">Pilgrim <span className="home__here">here</span></h1>
          <h3 className="home__education">Gameplay Programmer</h3>
          <div className="home__buttons">
            <a href={site.resume} download className="button button--ghost">Download CV</a>
            <a href="#about" className="button">About Me.</a>
          </div>
        </div>
        <div className="home__handle">
          <Image src="/images/pilgrim-hero.png" alt="Pilgrim portrait" className="home__img" width={840} height={840} priority />
        </div>
        <div className="home__social">
          <a href={site.socials.linkedin} target="_blank" rel="noopener noreferrer" className="home__social-link" title="LinkedIn" aria-label="LinkedIn"><Linkedin size={17} /></a>
          <a href={site.socials.github} target="_blank" rel="noopener noreferrer" className="home__social-link" title="GitHub" aria-label="GitHub"><Github size={17} /></a>
        </div>
        <a href="#about" className="home__scroll"><Mouse className="home__scroll-icon" size={20} /><span className="home__scroll-name">Scroll Down</span></a>
      </div>
    </section>
  );
}

export function ClassicAbout() {
  const boxes = [
    { Icon: Award, title: "Experience", subtitle: "7+ Years" },
    { Icon: BriefcaseBusiness, title: "Completed", subtitle: "20+ Projects" },
    { Icon: Headset, title: "Available", subtitle: "Online 24/7" },
  ];
  return (
    <section className="about section" id="about">
      <SectionTitle subtitle="A little" title="About Me" />
      <div className="about__container container grid">
        <Image src="/images/about.png" alt="Pilgrim seated outdoors" className="about__img" width={350} height={350} />
        <div className="about__data">
          <div className="about__info">
            {boxes.map(({ Icon, title, subtitle }) => <div className="about__box" key={title}>
              <Icon size={24} className="about__icon" aria-hidden />
              <h3 className="about__title">{title}</h3>
              <span className="about__subtitle">{subtitle}</span>
            </div>)}
          </div>
          <p className="about__description">
            Gameplay Programmer and Product Designer.<br />
            I design, script and implement Game Mechanics, Systems and Managers that run within games.<br />
            I have experiences working with teams and studios. I have also gotten many positive reviews from my freelance days.<br />
            Worked on projects ranging from PC, Mobile, Web, Multiplayer, AR/VR and more.
          </p>
          <a href="#contact" className="button">Contact Me</a>
        </div>
      </div>
    </section>
  );
}

export function ClassicSkills() {
  return (
    <section className="skills section" id="skills">
      <SectionTitle subtitle="What are" title="My Skills" />
      <div className="skills__container container grid">
        {skillGroups.map((group) => <div key={group.title} className="skills__content">
          <h3 className="skills__title">{group.title}</h3>
          <div className="skills__box">
            {[group.left, group.right].map((skills, column) => <div className="skills__group" key={column}>
              {skills.map((skill) => <div className="skills__data" key={skill.name}>
                <BadgeCheck className="skills__check" size={17} aria-hidden />
                <div><h3 className="skill__name">{skill.name}</h3><span className="skill__level">{skill.level}</span></div>
              </div>)}
            </div>)}
          </div>
        </div>)}
      </div>
    </section>
  );
}

function Services() {
  const refs = useRef<(HTMLDialogElement | null)[]>([]);
  return (
    <section className="services section" id="services">
      <SectionTitle subtitle="I Offer These" title="Services" />
      <div className="services__container container grid">
        {classicServices.map((service, index) => <div key={service.title} className="services__card">
          <h3 className="services__title">{index === 0 ? <>Unity Game<br />Development</> : index === 1 ? <>C#<br />Programming</> : <>Visual<br />Designs</>}</h3>
          <button className="services__button" type="button" onClick={() => refs.current[index]?.showModal()}>
            See More <ArrowRight className="services__icon" size={17} aria-hidden />
          </button>
          <dialog ref={(el) => { refs.current[index] = el; }} className="services__modal" onClick={(event) => { if (event.target === event.currentTarget) refs.current[index]?.close(); }} aria-label={`${service.modalTitle} service details`}>
            <div className="services__modal-content">
              <button type="button" className="services__modal-close" aria-label="Close details" onClick={() => refs.current[index]?.close()}><X size={24} /></button>
              <h3 className="services__modal-title">{service.modalTitle}</h3>
              <p className="services__modal-description">{service.description}</p>
              <ul className="services__modal-list">{service.details.map((detail) => <li key={detail} className="services__modal-item"><Check className="services__modal-icon" size={19} aria-hidden /><p className="services__modal-info">{detail}</p></li>)}</ul>
            </div>
          </dialog>
        </div>)}
      </div>
    </section>
  );
}

export function ClassicWork({ showDetails = false }: { showDetails?: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = projects.filter((project) => filter === "all" || project.category === filter);
  return (
    <section className="work section" id="work">
      <SectionTitle subtitle="Check Out My" title="Recent Projects" />
      <div className="work__filters" role="group" aria-label="Filter projects">
        {([{ filter: "all", label: "General" }, { filter: "3d", label: "3D Projects" }, { filter: "2d", label: "2D Projects" }] as const).map((item) => (
          <button key={item.filter} type="button" className={`work__item ${filter === item.filter ? "active-work" : ""}`} aria-pressed={filter === item.filter} onClick={() => setFilter(item.filter)}>{item.label}</button>
        ))}
      </div>
      <div className="work__container container grid" aria-live="polite">
        {visible.map((project) => <article className="work__card" key={project.slug}>
          <Image src={project.image} alt={`${project.title} project image`} width={projectImageDimensions[project.image.split("/").at(-1) ?? ""]?.width ?? 295} height={projectImageDimensions[project.image.split("/").at(-1) ?? ""]?.height ?? 160} className="work__img" sizes="(max-width: 766px) 85vw, 295px" />
          <h3 className="work__title">{project.title}</h3>
          <a className="work__button" href={project.url} target="_blank" rel="noopener noreferrer">{project.action === "Explore game" ? "Check Out Game" : project.action === "See files" ? "See Files" : project.action === "Watch video" ? "Watch Video" : "Watch Demo"} <ArrowRight size={17} className="work__icon" aria-hidden /></a>
          {showDetails && <Link className="work__detail-link" href={`/projects/${project.slug}`}>Project details <ArrowRight size={15} aria-hidden /></Link>}
        </article>)}
        {filter === "all" && <div className="work__card"><a href={allProjectsUrl} target="_blank" rel="noopener noreferrer" className="work__button"><h3 className="work__button">View All Projects <ChevronRight size={17} className="work__icon" aria-hidden /></h3></a></div>}
      </div>
    </section>
  );
}

export function ClassicStudios() {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const suppressClickRef = useRef(false);
  const rebaseRef = useRef(false);
  const selectedRef = useRef(0);
  const [slide, setSlide] = useState(0);
  const count = classicStudios.length;

  // Three repeated groups make the visual loop seamless, in either direction.
  // Only the middle group is exposed to assistive technology and keyboard focus.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const center = track.children.item(count) as HTMLElement | null;
    if (!center) return;
    const setup = () => {
      const middle = track.children.item(count) as HTMLElement | null;
      if (middle) track.scrollLeft = middle.offsetLeft - (track.children.item(0) as HTMLElement).offsetLeft;
    };
    setup();
    const observer = new ResizeObserver(() => {
      // Reinitialize on layout resize to keep the selected studio centered.
      const target = track.children.item(count + selectedRef.current) as HTMLElement | null;
      const first = track.children.item(0) as HTMLElement | null;
      if (target && first) track.scrollLeft = target.offsetLeft - first.offsetLeft;
    });
    observer.observe(track);
    return () => observer.disconnect();
    // Only initialize the infinite track when it mounts.
  }, [count]);

  function scrollToStudio(index: number) {
    const track = trackRef.current;
    const first = track?.children.item(0) as HTMLElement | null;
    if (!track || !first) return;
    const options = [index, index + count, index + 2 * count]
      .map(i => track.children.item(i) as HTMLElement | null)
      .filter((el): el is HTMLElement => Boolean(el))
      .map(el => el.offsetLeft - first.offsetLeft);
    const closest = options.reduce((best, value) => Math.abs(value - track.scrollLeft) < Math.abs(best - track.scrollLeft) ? value : best, options[0]);
    track.scrollTo({ left: closest, behavior: "smooth" });
    selectedRef.current = index;
    setSlide(index);
  }

  function syncSlide() {
    const track = trackRef.current;
    if (!track || rebaseRef.current) return;
    const first = track.children.item(0) as HTMLElement | null;
    const middle = track.children.item(count) as HTMLElement | null;
    const last = track.children.item(2 * count) as HTMLElement | null;
    if (!first || !middle || !last) return;
    const middleStart = middle.offsetLeft - first.offsetLeft;
    const groupLength = last.offsetLeft - middle.offsetLeft;
    const nextItem = track.children.item(count + 1) as HTMLElement | null;
    const itemWidth = nextItem ? nextItem.offsetLeft - middle.offsetLeft : middle.offsetWidth;
    const leftLimit = middleStart - itemWidth * .8;
    const rightLimit = middleStart + groupLength;
    const x = track.scrollLeft;
    if (x < leftLimit || x >= rightLimit) {
      const adjusted = x < leftLimit ? x + groupLength : x - groupLength;
      rebaseRef.current = true;
      // Temporarily disable snapping/smoothing so the reposition isn't visible.
      const previousBehavior = track.style.scrollBehavior;
      const previousSnap = track.style.scrollSnapType;
      track.style.scrollBehavior = "auto";
      track.style.scrollSnapType = "none";
      track.scrollLeft = adjusted;
      if (dragRef.current.active) dragRef.current.startScroll += adjusted - x;
      requestAnimationFrame(() => {
        track.style.scrollBehavior = previousBehavior;
        track.style.scrollSnapType = previousSnap;
        rebaseRef.current = false;
      });
    }
    const children = Array.from(track.children) as HTMLElement[];
    const nearest = children.reduce<{ index: number; distance: number }>((best, el, i) => {
      const distance = Math.abs(el.offsetLeft - first.offsetLeft - track.scrollLeft);
      return distance < best.distance ? { index: i, distance } : best;
    }, { index: count, distance: Infinity });
    selectedRef.current = nearest.index % count;
    setSlide(selectedRef.current);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    dragRef.current = { active: true, startX: event.clientX, startScroll: event.currentTarget.scrollLeft, moved: false };
  }
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag.active) return;
    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 6) drag.moved = true;
    if (!drag.moved) return;
    event.currentTarget.classList.add("is-dragging");
    event.currentTarget.scrollLeft = drag.startScroll - delta;
  }
  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current.moved) {
      suppressClickRef.current = true;
      window.setTimeout(() => { suppressClickRef.current = false; }, 50);
    }
    dragRef.current.active = false;
    event.currentTarget.classList.remove("is-dragging");
  }
  function preventDragClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
    }
  }

  return <section className="jobs section" id="jobs">
    <SectionTitle subtitle="Highlights of" title="Studios Worked" />
    <div className="jobs__container container">
      <div className="jobs__viewport">
        <div className="jobs__track" ref={trackRef} onScroll={syncSlide}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove}
          onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
          onClickCapture={preventDragClick} onDragStart={(event) => event.preventDefault()}
          role="region" aria-roledescription="carousel" aria-label="Studios worked with" tabIndex={0}>
          {[0, 1, 2].flatMap((copy) => classicStudios.map((studio) => {
            const duplicate = copy !== 1;
            const content = <><Image src={studio.logo} alt={duplicate ? "" : `${studio.name} logo`} className="jobs__img" width={60} height={60} /><h3 className="jobs__name">{studio.name}</h3><p className="jobs__description">{studio.description}</p></>;
            return studio.url
              ? <a href={studio.url} target="_blank" rel="noopener noreferrer" tabIndex={duplicate ? -1 : undefined} aria-hidden={duplicate ? true : undefined} className="jobs__card" key={`${copy}-${studio.name}`}>{content}</a>
              : <div className="jobs__card" aria-hidden={duplicate ? true : undefined} key={`${copy}-${studio.name}`}>{content}</div>;
          }))}
        </div>
      </div>
      <div className="jobs__pagination" aria-label="Studio carousel pagination">
        {classicStudios.map((studio, index) => <button key={studio.name} type="button" title={`Go to ${studio.name}`} aria-label={`Show ${studio.name}`} aria-current={index === slide ? "true" : undefined} className="jobs__dot" onClick={() => scrollToStudio(index)} />)}
      </div>
    </div>
  </section>;
}

export function ClassicContact() {
  const options = [
    { Icon: Mail, title: "Email", text: site.email, cta: "Write Me", href: `mailto:${site.email}` },
    { Icon: MessageCircle, title: "WhatsApp", text: "+234-811-220-0157", cta: "Chat Me Up", href: site.whatsappUrl },
    { Icon: MessageCircle, title: "Discord", text: site.discord, cta: "DM's Open.", href: site.discordUrl },
  ];
  return (
    <section className="contact section" id="contact">
      <SectionTitle subtitle="Let's have a talk." title="Contact Me" />
      <div className="contact__container container grid">
        <div className="contact__info">
          {options.map(({ Icon, title, text, cta, href }) => <div className="contact__card" key={title}>
            <Icon className="contact__card-icon" size={30} aria-hidden />
            <h3 className="contact__card-title">{title}</h3>
            <span className="contact__card-data">{text}</span>
            <a href={href} target={href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" className="contact__button">{cta} <ArrowRight className="contact__button-icon" size={16} aria-hidden /></a>
          </div>)}
        </div>
        <div className="contact__content"><h3 className="contact__title">Write me your project.</h3><ClassicContactForm /></div>
      </div>
    </section>
  );
}

/** Exact sections, order, original content and styling hooks from the static portfolio. */
export function ClassicHome() {
  return <div className="original-site main"><Hero /><ClassicAbout /><ClassicSkills /><Services /><ClassicWork /><ClassicStudios /><ClassicContact /></div>;
}
