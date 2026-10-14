"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, BriefcaseBusiness, House, MessageSquareText, Moon, Sun, UserRound } from "lucide-react";

const portfolioNavigation = [
  { id: "home", label: "Portfolio top", icon: House },
  { id: "skills", label: "The Practice", icon: BookOpen },
  { id: "work", label: "Selected Work", icon: BriefcaseBusiness },
  { id: "jobs", label: "Studios Worked", icon: UserRound },
  { id: "contact", label: "Let's Talk", icon: MessageSquareText },
] as const;

const designNavigation = [
  { id: "home", label: "Product design top", icon: House },
  { id: "about", label: "About Product Design", icon: UserRound },
  { id: "process", label: "Design focus", icon: BookOpen },
  { id: "work", label: "Product showcases", icon: BriefcaseBusiness },
  { id: "contact", label: "Contact", icon: MessageSquareText },
] as const;

export function Header() {
  const pathname = usePathname();
  const inGamePortfolio = pathname === "/gamedev";
  const inDesignPortfolio = pathname === "/product-design" || pathname.startsWith("/product-design/");
  const inPortfolio = inGamePortfolio || inDesignPortfolio;
  const currentNavigation = inGamePortfolio ? portfolioNavigation : designNavigation;
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > 50);
      if (!inPortfolio) return;
      const links = inGamePortfolio ? portfolioNavigation : designNavigation;
      const current = links.map(({ id }) => document.getElementById(id))
        .filter((element): element is HTMLElement => Boolean(element))
        .filter((element) => element.getBoundingClientRect().top < window.innerHeight * .36)
        .at(-1);
      setActive(current?.id ?? "home");
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [inPortfolio, inGamePortfolio]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try { localStorage.setItem("archeon-theme", next); } catch { /* Private browsing may disable storage. */ }
  };

  return <>
    <header className={`header ${scrolled ? "scroll-header" : ""}`} id="header">
      <nav className="nav container" aria-label="Site header">
        <Link href="/" className="nav__logo">archeon</Link>
        <button id="theme-button" className="change-theme" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title="Switch color theme">
          {theme === "dark" ? <Moon size={20} strokeWidth={1.8} /> : <Sun size={20} strokeWidth={1.8} />}
        </button>
      </nav>
    </header>
    {inPortfolio && <nav className="bottom-nav" aria-label={inGamePortfolio ? "Game development portfolio sections" : "Product design portfolio sections"}>
      <ul className="nav__list">
        {currentNavigation.map(({ id, label, icon: Icon }) => <li key={id} className="nav__item">
          <Link href={`${inGamePortfolio ? "/gamedev" : "/product-design"}#${id}`} title={label} aria-label={label} aria-current={active === id ? "location" : undefined} className={`nav__link ${active === id ? "active-link" : ""}`}>
            <Icon size={20} strokeWidth={1.8} aria-hidden />
          </Link>
        </li>)}
      </ul>
    </nav>}
  </>;
}
