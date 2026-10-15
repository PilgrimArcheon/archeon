import Link from "next/link";
import { Instagram, MessageCircle } from "lucide-react";
import { site } from "@/data/site";

/** The current X mark, instead of the retired Twitter bird. */
function XMark() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.47l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.933Zm-1.29 19.49h2.039L6.486 3.24H4.298L17.61 20.644Z" />
  </svg>;
}

export function Footer() {
  return <footer className="footer">
    <div className="footer__container container">
      <h2 className="footer__title">archeon</h2>
      <ul className="footer__list">
        <li><Link className="footer__link" href="/">Home</Link></li>
        <li><Link className="footer__link" href="/gamedev">Game Dev</Link></li>
        <li><Link className="footer__link" href="/product-design">Product Design</Link></li>
        <li><Link className="footer__link" href="/projects">Projects</Link></li>
        <li><Link className="footer__link" href="/app">Apps</Link></li>
        <li><Link className="footer__link" href="/contact">Contact</Link></li>
        <li><Link className="footer__link" href="/app/support">Support & FAQs</Link></li>
        <li><Link className="footer__link" href="/app/privacy">Privacy Policy</Link></li>
        <li><Link className="footer__link" href="/app/terms">Terms of Use</Link></li>
      </ul>
      <ul className="footer__social">
        <li><a className="footer__social-link" href={site.socials.messenger} target="_blank" rel="noopener noreferrer" aria-label="Messenger"><MessageCircle size={18} aria-hidden /></a></li>
        <li><a className="footer__social-link" href={site.socials.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram size={18} aria-hidden /></a></li>
        <li><a className="footer__social-link" href={site.socials.x} target="_blank" rel="noopener noreferrer" aria-label="X (formerly Twitter)"><XMark /></a></li>
      </ul>
      <span className="footer__copy">© {new Date().getFullYear()} archeon. All rights reserved.</span>
    </div>
  </footer>;
}
