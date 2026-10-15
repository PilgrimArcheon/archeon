import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./legal-page.module.css";

export function LegalPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.nav}>
          <Link href="/app" className={styles.wordmark}>archeon<span>.</span></Link>
          <Link href="/app" className={styles.back}>← All apps &amp; tools</Link>
        </header>
        <div className={styles.layout}>
          <aside className={styles.aside} aria-label="Legal navigation">
            <p>POLICIES &amp; TRUST</p>
            <Link href="/app/privacy">Privacy policy</Link>
            <Link href="/app/terms">Terms of use</Link>
            <Link href="/app/support?source=archeon">Contact &amp; support</Link>
          </aside>
          <article className={styles.article}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1>{title}<span>.</span></h1>
            <p className={styles.lead}>{description}</p>
            <p className={styles.updated}>Effective: 15 October 2026 · Applies to Archeon Apps &amp; Tools</p>
            <div className={styles.content}>{children}</div>
            <div className={styles.legalEnd}>
              <span>Have a question or privacy request?</span>
              <Link href="/app/support?source=archeon">Contact Archeon support ↗</Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
