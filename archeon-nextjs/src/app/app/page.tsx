import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Plus,
  Sparkles,
} from "lucide-react";
import { archeonApps } from "@/features/apps/registry";
import styles from "./apps.module.css";
import { RequestAppButton } from "@/components/archeon/RequestAppButton";

export const metadata: Metadata = {
  title: "Apps",
  description: "An evolving collection of tools built by Archeon.",
};

export default function AppsHub() {
  return (
    <div className={styles.hub}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <Link href="/" className={styles.logo} aria-label="Archeon homepage">
            archeon<span>.</span>
          </Link>
          <Link href="/" className={styles.back}>
            <ArrowLeft size={15} /> Back to Archeon
          </Link>
        </header>

        <section className={styles.hero}>
          <div className={styles.kicker}>
            <span className={styles.kickerDot} /> THE ARCHEON TOOLBOX
          </div>
          <h1>
            Built for the <em>work behind</em>
            <br className={styles.desktopBreak} /> the work
            <span className={styles.period}>.</span>
          </h1>
          <p>
            A growing home for the small, useful tools that make creative
            projects run smoother. Everything in one place.
          </p>
          <div className={styles.heroMeta}>
            <span>
              <Sparkles size={14} /> Independent tools
            </span>
            <span className={styles.metaRule} />
            <span>
              {archeonApps.length} live app{archeonApps.length !== 1 ? "s" : ""}
            </span>
          </div>
        </section>

        <section className={styles.apps} aria-labelledby="available-apps">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionEyebrow}>YOUR WORKSPACE</span>
              <h2 id="available-apps">Explore apps</h2>
            </div>
            <span className={styles.sectionCount}>
              {String(archeonApps.length).padStart(2, "0")} / ACTIVE
            </span>
          </div>
          <div className={styles.cards}>
            {archeonApps.map((app, index) => (
              <Link href={app.href} className={styles.appCard} key={app.slug}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardIcon}>
                    {app.slug === "tackboard" ? <Image src="/images/tackboard-icon.png" width={38} height={38} alt="" /> : <Image src="/images/invoice-studio-icon.svg" width={38} height={38} alt="" /> }
                  </span>
                  <span className={styles.cardArrow}>
                    <ArrowRight size={18} />
                  </span>
                </div>
                <div className={styles.cardIndex}>
                  APP {String(index + 1).padStart(2, "0")} <span>·</span>{" "}
                  {app.category}
                </div>
                <h3>{app.title}</h3>
                <p>{app.description}</p>
                <div className={styles.cardBottom}>
                  <span className={styles.available}>
                    <span className={styles.liveDot} /> Available now
                  </span>
                  <span className={styles.private}>
                    <LockKeyhole size={13} /> {app.privacy}
                  </span>
                </div>
              </Link>
            ))}
            <div className={styles.comingCard}>
              <span className={styles.comingIcon}>
                <Plus size={22} strokeWidth={1.5} />
              </span>
              <h3>Something next.</h3>
              <p>
                More tools will live here as we build them, with their own
                routes under /app.
              </p>
              <RequestAppButton/>
              <span className={styles.comingTag}>MORE TO COME</span>
            </div>
          </div>
        </section>
        <footer className={styles.footer}>
          <span>© {new Date().getFullYear()} ARCHEON</span>
          <Link href="/app/support">FAQs & Support</Link>
        </footer>
      </div>
    </div>
  );
}
