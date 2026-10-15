import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/archeon/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Archeon Apps & Tools",
  description: "How Archeon Apps & Tools collects, stores, protects, and uses information across TackBoard, Invoice Studio, and related services.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="PRIVACY & DATA"
      title="Privacy policy"
      description="A plain-language overview of the information Archeon uses to run its apps, how it is stored, and the choices you have."
    >
      <section>
        <h2>1. Who this applies to</h2>
        <p>
          This policy covers Archeon Apps &amp; Tools, including TackBoard (web and desktop),
          Invoice Studio, associated Archeon accounts, and our support pages. Archeon operates
          these services. For questions or personal-data requests, use our
          {" "}<Link href="/app/support?source=archeon">support form</Link>.
        </p>
      </section>
      <section>
        <h2>2. Information we handle</h2>
        <ul>
          <li><strong>Account information:</strong> email address, account identifiers, protected password hashes, sign-in sessions, and security/rate-limit records.</li>
          <li><strong>TackBoard content:</strong> boards, notes, checklist items, settings, and cloud-sync metadata when you choose to sign in or pair the desktop app.</li>
          <li><strong>Invoice Studio content:</strong> business details, customer names and contact details, invoice line items and amounts, payment records, settings, and document/send status that you enter or save.</li>
          <li><strong>Gmail connection:</strong> the connected Google email address, authorization permissions, and an encrypted refresh token, if you explicitly connect Google.</li>
          <li><strong>Support and feedback:</strong> messages, optional reply addresses, and details you submit through support or contact forms.</li>
          <li><strong>Technical information:</strong> essential cookies, limited request and abuse-prevention information, and hosting or delivery logs needed to operate, secure, and troubleshoot the services.</li>
        </ul>
        <p>Do not put passwords, government identification numbers, or other highly sensitive information into notes, feedback, or invoice descriptions unless truly necessary for your work.</p>
      </section>
      <section>
        <h2>3. Local and cloud storage</h2>
        <p>
          TackBoard can work locally: guest boards and recovery copies may be stored
          in your browser&apos;s local storage, and desktop app data can remain on your device.
          Browser storage can disappear if you clear site data or use another device.
          When signed in, TackBoard synchronizes content with an account-specific workspace in our database.
        </p>
        <p>
          Invoice Studio uses browser session storage for some unsaved guest work. Signed-in
          invoice records, clients, and settings are saved to an account workspace in our database.
          Creating a PDF may require sending its contents to our server to generate the document.
          If you choose to send an invoice, its contents and the recipient&apos;s details are shared
          with your connected email provider to deliver it.
        </p>
      </section>
      <section>
        <h2>4. Why we use information</h2>
        <p>
          We use information to provide the features you request; authenticate accounts; store and
          synchronize your work; generate invoices and receipts; send email when you initiate it;
          respond to support requests; prevent misuse; maintain service reliability; and comply with
          applicable legal obligations. We do not use your invoice contents or TackBoard notes to
          target advertising.
        </p>
      </section>
      <section>
        <h2>5. Google and Gmail access</h2>
        <p>
          If you connect Gmail in Invoice Studio, Archeon requests your verified Google email
          address and permission to <strong>send email on your behalf</strong> (<code>gmail.send</code>).
          We use this authorization solely to help you send the invoices or receipts you choose,
          with the message and PDF attachment you provide. The integration does not request
          permission to read your Gmail inbox.
        </p>
        <p>
          Gmail refresh tokens are encrypted on the server and are not exposed to the browser.
          You can disconnect Gmail in Invoice Studio, which removes the saved connection and
          requests token revocation. You can also revoke access from your Google Account.
          Google&apos;s own privacy terms apply to its services. Archeon&apos;s use and transfer of
          information received from Google APIs follows the Google API Services User Data Policy,
          including its Limited Use requirements.
        </p>
      </section>
      <section>
        <h2>6. Services that process information</h2>
        <p>
          We use hosting, database, and communications providers to run Archeon. These may
          include Vercel (hosting and operational logs), Neon (database hosting), Google
          (only when you connect Gmail), and Brevo (transactional email if the applicable
          email feature is configured). GitHub hosts public installer downloads. These
          providers process relevant information under their own terms and safeguards.
          We may disclose information if legally required or necessary to protect users or the service.
        </p>
        <p>
          Providers may process information in different countries. We aim to use reasonable
          safeguards when we make data available to service providers, subject to applicable law.
        </p>
      </section>
      <section>
        <h2>7. Security</h2>
        <p>
          We use security measures appropriate to the features, including salted password hashing,
          secure production session cookies, account/workspace access checks, and encryption
          of stored Gmail refresh tokens. We limit Gmail access to the permissions used by the feature.
          No online or local software can guarantee absolute security, so you should keep separate
          backups of important notes and business records and secure your own devices and accounts.
        </p>
      </section>
      <section>
        <h2>8. Retention and your choices</h2>
        <p>
          Signed-in work generally remains in the connected workspace until it is edited,
          deleted using an available feature, or we process an applicable deletion request.
          Security and service records may be held for operational needs, while backups and records
          subject to legal obligations can remain for a limited additional period.
          We do not currently publish a universal, fixed deletion timetable for every data type.
        </p>
        <p>
          You may use TackBoard without an account, clear local browser storage, disconnect Gmail,
          or request access, correction, export, or deletion of account-related information through
          {" "}<Link href="/app/support?source=archeon">support</Link>. We may need to verify
          your identity and may retain information when required by law. Automated whole-account
          deletion and password recovery are not available in every app yet.
        </p>
      </section>
      <section>
        <h2>9. Cookies and children</h2>
        <p>
          We use essential cookies for authentication and security, and local browser storage
          for application data and preferences such as your appearance setting. We do not currently
          operate a third-party advertising tracking feature in these apps. These tools are not
          specifically intended for children, and children should not submit personal information
          without appropriate permission.
        </p>
      </section>
      <section>
        <h2>10. Updates and contact</h2>
        <p>
          We may update this policy as features or data handling change. We will update the
          effective date, and give additional notice where required by law. Your privacy rights
          depend on your location and applicable law. For any question or request, contact us through
          {" "}<Link href="/app/support?source=archeon">Archeon Support</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
