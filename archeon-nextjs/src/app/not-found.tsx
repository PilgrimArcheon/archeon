import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="original-site main">
      <section className="section simple-page">
        <span className="section__subtitle">Page Not Found</span>
        <h1 className="section__title">404</h1>
        <div className="container" style={{ maxWidth: 440 }}>
          <div className="simple-page-card" style={{ textAlign: "center" }}>
            <p className="simple-page-copy" style={{ marginBottom: "1.5rem" }}>This page isn&apos;t available yet.</p>
            <Link href="/" className="simple-page-link"><ArrowLeft size={17} aria-hidden /> Back Home</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
