"use client";

import Link from "next/link";
import { useRef } from "react";
import { AlertCircle, ArrowUpRight, HelpCircle, X } from "lucide-react";
import styles from "./desktop.module.css";

/** Native modal dialog: keyboard focus is managed by the browser; Escape closes it. */
export function DesktopOpenHelp() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <section className={styles.helpPanel} aria-labelledby="desktop-opening-heading">
        <div className={styles.helpSymbol}><HelpCircle size={22} aria-hidden="true" /></div>
        <div className={styles.helpCopy}>
          <h2 id="desktop-opening-heading">Problem opening the desktop app?</h2>
          <p>
            Early TackBoard installers may trigger a Windows SmartScreen warning or
            macOS Gatekeeper. Read our safe-opening guide before proceeding.
          </p>
        </div>
        <button
          ref={triggerRef}
          type="button"
          className={styles.helpTrigger}
          onClick={() => dialogRef.current?.showModal()}
          aria-haspopup="dialog"
        >
          Opening guide <ArrowUpRight size={15} aria-hidden="true" />
        </button>
      </section>
      <dialog
        ref={dialogRef}
        className={styles.helpDialog}
        aria-labelledby="opening-guide-title"
        aria-describedby="opening-guide-intro"
        onClose={() => triggerRef.current?.focus()}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
      >
        <div className={styles.dialogInner}>
          <div className={styles.dialogTop}>
            <div>
              <p className={styles.dialogKicker}>TACKBOARD / INSTALL HELP</p>
              <h2 id="opening-guide-title">Having trouble opening TackBoard?</h2>
            </div>
            <button
              className={styles.closeButton}
              type="button"
              aria-label="Close installation guide"
              onClick={() => dialogRef.current?.close()}
            ><X size={19} aria-hidden="true" /></button>
          </div>
          <p className={styles.dialogIntro} id="opening-guide-intro">
            Version 0.6.x is a testing preview. Until our Windows builds are signed and
            our Mac builds are signed and notarized, your computer may ask you to
            verify the app before opening it.
          </p>
          <div className={styles.securityNote}>
            <AlertCircle size={19} aria-hidden="true" />
            <p>
              <strong>Only continue if you trust this download.</strong> Use the
              official TackBoard release linked on this page; check its filename
              and checksums if possible. If your antivirus identifies actual malware,
              stop rather than bypassing protection. Never turn off antivirus or
              system-wide security settings for TackBoard.
            </p>
          </div>
          <section className={styles.guideSection} aria-labelledby="windows-guide-heading">
            <div className={styles.guideLabel}>01 / WINDOWS 10 &amp; 11</div>
            <h3 id="windows-guide-heading">Windows protected your PC</h3>
            <ol>
              <li>Confirm you downloaded the <strong>.exe</strong> installer from our official release page.</li>
              <li>If a Microsoft Defender SmartScreen window appears, select <strong>More info</strong>.</li>
              <li>If <strong>Run anyway</strong> appears and you trust the file, choose it to continue the installation.</li>
              <li>If Windows or your security software blocks it as malicious, do not override that warning; <Link href="/app/support?source=tackboard">contact support</Link>.</li>
            </ol>
          </section>
          <section className={styles.guideSection} aria-labelledby="mac-guide-heading">
            <div className={styles.guideLabel}>02 / MACOS</div>
            <h3 id="mac-guide-heading">“TackBoard” Not Opened</h3>
            <ol>
              <li>Download the correct <strong>.dmg</strong> for your Mac: Apple Silicon (arm64) or Intel (x64).</li>
              <li>Open the DMG and drag TackBoard into <strong>Applications</strong>, then try opening it.</li>
              <li>If macOS blocks the launch, click <strong>Done</strong>, then open <strong>Apple menu → System Settings → Privacy &amp; Security</strong>.</li>
              <li>Scroll to <strong>Security</strong>, choose <strong>Open Anyway</strong> for TackBoard, authenticate if prompted, and confirm <strong>Open</strong>.</li>
              <li>If the option isn&apos;t shown, try opening the app again; the option is usually available for about an hour after a blocked launch. Do not disable Gatekeeper in Terminal.</li>
            </ol>
          </section>
          <p className={styles.dialogEnd}>
            These are temporary instructions for trusted preview downloads—not a substitute
            for signing and notarization. Review the <Link href="/app/terms">preview terms</Link>
            {" "}and <Link href="/app/privacy">privacy policy</Link> or <Link href="/app/support?source=tackboard">ask for help</Link>.
          </p>
          <button className={styles.dialogDone} type="button" onClick={() => dialogRef.current?.close()}>
            Got it
          </button>
        </div>
      </dialog>
    </>
  );
}
