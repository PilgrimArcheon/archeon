import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/archeon/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use — Archeon Apps & Tools",
  description: "Terms governing Archeon apps and tools, including preview builds, user content, invoice sending, and customer rights.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="TERMS / EARLY ACCESS"
      title="Terms of use"
      description="The conditions for using Archeon Apps & Tools, including how early-access versions differ from stable releases."
    >
      <section>
        <h2>1. Scope and agreement</h2>
        <p>
          These terms govern Archeon Apps &amp; Tools, including TackBoard web and desktop,
          Invoice Studio, related account features, downloads, and any additional apps identified
          as part of Archeon. By using them, you agree to these terms. If you do not agree,
          please do not use the affected service.
        </p>
      </section>
      <section>
        <h2>2. Preview builds (v0.6 and later 0.x releases)</h2>
        <p>
          Apps labelled <strong>Preview, Beta, Early Access, or version 0.x</strong>—including
          TackBoard <strong>v0.6.0</strong> and later pre-1.0 versions—are released primarily
          for evaluation and testing. Features may be unfinished or change without notice.
          Preview builds may crash, fail to sync, lose local changes, contain errors,
          or be unavailable. Do not rely on preview apps as the sole record of important work.
        </p>
        <p>
          Keep independent backups and review generated invoices and emails before sending them.
          Early desktop installers may be unsigned or unnotarized; this status is disclosed
          on the download page. Only install files from our official download links.
        </p>
      </section>
      <section>
        <h2>3. Stable releases (version 1.0 and above)</h2>
        <p>
          Versions numbered <strong>1.0.0 or higher</strong> may be designated as public/stable
          releases once they are explicitly labelled that way on the relevant app or download
          page. A version number alone does not guarantee certification, code signing,
          notarization, perfect reliability, or suitability for a particular purpose.
          Where applicable, completed signing or notarization will be identified separately.
        </p>
      </section>
      <section>
        <h2>4. Your account and content</h2>
        <p>
          You are responsible for the accuracy and legality of the information you enter,
          for keeping your sign-in credentials and desktop pairing keys secure, and for
          maintaining copies of important data. You retain your rights in the notes,
          invoices, documents, and other content you create. You give Archeon the limited
          permission needed to store, process, synchronize, and transmit that content
          to provide the features you choose.
        </p>
      </section>
      <section>
        <h2>5. Invoicing and email</h2>
        <p>
          Invoice Studio is a document and workflow tool, not legal, accounting, tax,
          or financial advice. You are responsible for checking amounts, payment details,
          tax requirements, recipient addresses, and the legality of invoices and receipts.
          Payment statuses may be entered or changed manually; they do not establish that
          funds have actually been received.
        </p>
        <p>
          When you connect Gmail, you authorize Archeon to send only the invoice or receipt
          emails you initiate through the integration. Do not use Archeon to send unsolicited
          bulk email, spam, fraudulent demands, illegal content, or messages that violate
          others&apos; rights or your email provider&apos;s rules.
        </p>
      </section>
      <section>
        <h2>6. Responsible use and availability</h2>
        <p>
          Do not try to access other users&apos; data, interfere with the service,
          reverse-engineer security controls, distribute malware, or overload our systems.
          We may limit or suspend access when reasonably necessary for security, maintenance,
          legal compliance, or serious violations of these terms. Services may be changed,
          interrupted, or discontinued; we will provide notice when reasonably possible.
        </p>
      </section>
      <section>
        <h2>7. Preview warranties and responsibility</h2>
        <p>
          To the extent permitted by applicable law, preview software is provided
          <strong> “as is” and “as available”</strong>, without promises that it will be
          error-free, uninterrupted, or fit for a specific purpose. Archeon does not accept
          responsibility for losses resulting solely from ordinary preview malfunctions
          where applicable law permits that exclusion, including lost unsaved work,
          missed reminders, or incorrectly drafted documents.
        </p>
        <p>
          To the extent permitted by applicable law, Archeon&apos;s liability for
          indirect or consequential loss is limited. <strong>Nothing in these terms excludes
          liability that cannot lawfully be excluded</strong>, or removes mandatory consumer,
          data-protection, fraud, or other statutory rights. These provisions do not prevent
          you from pursuing remedies available under applicable law.
        </p>
      </section>
      <section>
        <h2>8. Third-party services and downloads</h2>
        <p>
          Archeon may rely on third-party services such as hosting providers,
          cloud databases, Google Gmail, and GitHub downloads. Those providers may have
          separate terms and service limits. We cannot guarantee the operation of their
          systems. Installer security warnings should be considered carefully;
          see the <Link href="/app/tackboard/desktop">TackBoard download guide</Link>
          {" "}for the temporary, platform-specific preview instructions.
        </p>
      </section>
      <section>
        <h2>9. Privacy, changes, and contact</h2>
        <p>
          Our <Link href="/app/privacy">Privacy Policy</Link> explains data handling.
          We may update these terms when services change and publish a revised effective
          date, providing additional notice where required. For problems, security concerns,
          questions, or rights requests, contact <Link href="/app/support?source=archeon">Archeon Support</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
