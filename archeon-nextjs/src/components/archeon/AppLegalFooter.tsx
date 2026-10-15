import Link from "next/link";
import styles from "./app-legal-footer.module.css";

/** Shared policy links across the entire /app suite (including future apps). */
export function AppLegalFooter() {
  return (
    <footer className={styles.footer} aria-label="Archeon Apps policies">
      <div className={styles.inner}>
        <p>© {new Date().getFullYear()} Archeon · Version 0.x apps are previews intended for testing.</p>
        <nav aria-label="App and tool policies">
          <Link href="/app/privacy">Privacy Policy</Link>
          <Link href="/app/terms">Terms of Use</Link>
          <Link href="/app/support?source=archeon">Support</Link>
        </nav>
      </div>
    </footer>
  );
}
