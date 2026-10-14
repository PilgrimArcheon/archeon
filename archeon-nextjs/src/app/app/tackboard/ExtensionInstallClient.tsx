"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowDownToLine, ArrowLeft, ArrowUpRight, Check, ChevronRight,
  Chrome, ClipboardCopy, Download, Info, Laptop, Moon,
  Puzzle, ShieldCheck, Sun,
} from "lucide-react";
import styles from "./extension-install.module.css";

type BrowserFamily = "firefox" | "chrome" | "unsupported";
type Theme = "light" | "dark";

const CHROME_STORE_URL = process.env.NEXT_PUBLIC_TACKBOARD_CHROME_STORE_URL ?? "";
const FIREFOX_ADDON_URL = process.env.NEXT_PUBLIC_TACKBOARD_FIREFOX_ADDON_URL ?? "";

const downloads = {
  firefox: "/downloads/tackboard-firefox-developer.zip",
  chrome: "/downloads/tackboard-chrome-developer.zip",
} as const;

function trustedInstallUrl(raw: string, browser: "firefox" | "chrome"): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    // Never present an arbitrary URL as a verified Chrome Web Store install.
    if (browser === "chrome" && !["chromewebstore.google.com", "chrome.google.com"].includes(url.hostname)) return null;
    // Firefox can use an AMO listing or a previously Mozilla-signed XPI hosted over HTTPS.
    return url.href;
  } catch { return null; }
}

function recognizeBrowser(userAgent: string): { browser: BrowserFamily; mobile: boolean } {
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
  if (/Firefox|FxiOS/i.test(userAgent)) return { browser: "firefox", mobile };
  if (/Chrome|Chromium|Edg\//i.test(userAgent) && !/OPR\//i.test(userAgent)) return { browser: "chrome", mobile };
  return { browser: "unsupported", mobile };
}

export default function ExtensionInstallClient() {
  const [browser, setBrowser] = useState<BrowserFamily>("unsupported");
  const [mobile, setMobile] = useState(false);
  const [detected, setDetected] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const result = recognizeBrowser(navigator.userAgent);
    setBrowser(result.browser);
    setMobile(result.mobile);
    setDetected(true);
    try {
      const saved = localStorage.getItem("archeon-app-theme");
      setTheme(saved === "light" ? "light" : "dark");
    } catch { /* storage can be disabled */ }
  }, []);

  const selected: "firefox" | "chrome" = browser === "firefox" ? "firefox" : "chrome";
  const storeUrl = trustedInstallUrl(selected === "firefox" ? FIREFOX_ADDON_URL : CHROME_STORE_URL, selected);
  const isPublished = !!storeUrl;
  const isFirefox = selected === "firefox";

  const copyDebugAddress = () => {
    navigator.clipboard.writeText("about:debugging#/runtime/this-firefox")
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); })
      .catch(() => setCopied(false));
  };

  return (
    <main className={`${styles.page} archeon-app-surface`} data-archeon-app-theme={theme}>
      <div className={styles.inner}>
        <header className={styles.topbar}>
          <Link href="/app/tackboard" className={styles.back}><ArrowLeft size={16}/> Back to TackBoard</Link>
          <span className={styles.brand}>archeon <span>/</span> tackboard.</span>
          <button className={styles.themeButton} type="button" onClick={() => {
            const next = theme === "dark" ? "light" : "dark";
            setTheme(next);
            try { localStorage.setItem("archeon-app-theme", next); } catch { /* optional persistence */ }
          }} aria-label={`Use ${theme === "dark" ? "light" : "dark"} mode`}>
            {theme === "dark" ? <Sun size={17}/> : <Moon size={17}/>}
          </button>
        </header>

        <section className={styles.hero}>
          <div className={styles.kicker}><span className={styles.dot}/> THE BROWSER COMPANION <span className={styles.kickerLine}/> INSTALL GUIDE</div>
          <h1>Keep your tasks <span>in their own window.</span></h1>
          <p>Click the browser toolbar icon to open the TackBoard launcher. From there, open a compact, movable window, recover a hidden window, or use a regular tab as a fallback.</p>
          <div className={styles.heroTags}><span><Puzzle size={14}/> Lightweight companion</span><span><ShieldCheck size={14}/> Private pairing</span><span><Laptop size={14}/> Desktop browsers</span></div>
        </section>

        <section className={styles.installCard} aria-label="Install TackBoard browser companion">
          <div className={styles.cardHeader}>
            <div><span className={styles.stepLabel}>01 / YOUR BROWSER</span><h2>Get TackBoard for your browser.</h2></div>
            {detected && !mobile && browser !== "unsupported" && <span className={styles.detected}><Check size={14}/> {isFirefox ? "Firefox detected" : "Chrome / Chromium detected"}</span>}
          </div>
          <div className={styles.browserSwitch} role="group" aria-label="Choose extension browser">
            <button type="button" className={selected === "firefox" ? styles.selected : ""} onClick={() => { setBrowser("firefox"); setCopied(false); }} aria-pressed={selected === "firefox"}>
              <span className={styles.firefoxGlyph} aria-hidden="true">◉</span> Firefox
            </button>
            <button type="button" className={selected === "chrome" ? styles.selected : ""} onClick={() => { setBrowser("chrome"); setCopied(false); }} aria-pressed={selected === "chrome"}>
              <Chrome size={18}/> Chrome / Chromium
            </button>
          </div>

          {mobile && <div className={styles.notice}><Info size={17}/><p>This companion is built for desktop Firefox and Chrome. You can still use the full TackBoard web app on your phone.</p></div>}
          {detected && browser === "unsupported" && !mobile && <div className={styles.notice}><Info size={17}/><p>Your browser wasn't recognized. Select Firefox or Chrome above to see the matching installation instructions.</p></div>}

          <div className={styles.installAction}>
            {isPublished ? <>
              <a className={styles.primary} href={storeUrl!} target="_blank" rel="noopener noreferrer"><Puzzle size={19}/> Install for {isFirefox ? "Firefox" : "Chrome"} <ArrowUpRight size={17}/></a>
              <p>The browser will open its official add-on installation flow. Review permissions and confirm the installation there.</p>
            </> : <>
              <div className={styles.devPill}>DEVELOPER PREVIEW — NOT YET IN THE EXTENSION STORES</div>
              <a className={styles.primary} href={downloads[selected]} download><Download size={19}/> Download updated {isFirefox ? "Firefox" : "Chrome"} test build <ArrowDownToLine size={17}/></a>
              <p>Store installation will appear here once the extension is published. Until then, use the steps below to test the unpacked build.</p>
            </>}
          </div>
        </section>

        {!isPublished && <section className={styles.steps} aria-label="Developer installation instructions">
          <div className={styles.stepsHeading}><span className={styles.stepLabel}>02 / INSTALL THE TEST BUILD</span><h2>{isFirefox ? "Firefox setup" : "Chrome setup"}</h2></div>
          <ol className={styles.stepList}>
            {isFirefox ? <>
              <li><span>01</span><p>Download and extract the Firefox ZIP. Leave the extracted folder somewhere you can find it.</p></li>
              <li><span>02</span><div><p>Open a <strong>new Firefox tab</strong>. Paste this exact address into the <strong>address bar at the top</strong>, then press Enter (don't search the web for it):</p>
                <div className={styles.codeRow}><code>about:debugging#/runtime/this-firefox</code><button type="button" onClick={copyDebugAddress} aria-label="Copy Firefox debugging address">{copied ? <Check size={16}/> : <ClipboardCopy size={16}/>}<span>{copied ? "Copied" : "Copy"}</span></button></div></div></li>
              <li><span>03</span><p>Under <strong>This Firefox</strong>, select <strong>Load Temporary Add-on…</strong> and choose <code>manifest.json</code> inside the extracted folder.</p></li>
              <li><span>04</span><p>Click the TackBoard toolbar icon. In the launcher, select <strong>Open TackBoard window</strong>. If the window stays hidden, click <strong>Reset hidden window</strong>. Use Settings to pair your account.</p></li>
            </> : <>
              <li><span>01</span><p>Download and extract the Chrome ZIP, so you have a folder containing <code>manifest.json</code>.</p></li>
              <li><span>02</span><p>In a new tab, enter <code>chrome://extensions</code> in the browser address bar, then enable <strong>Developer mode</strong>.</p></li>
              <li><span>03</span><p>Select <strong>Load unpacked</strong> and select the extracted extension folder.</p></li>
              <li><span>04</span><p>Pin TackBoard to the toolbar, click it to open the launcher, then select <strong>Open TackBoard window</strong>. If hidden, use <strong>Reset hidden window</strong>, or open in a tab.</p></li>
            </>}
          </ol>
          {isFirefox && <p className={styles.temporary}><Info size={16}/> Firefox removes temporary add-ons after you exit the browser. We'll replace this testing flow with a signed, permanent add-on when TackBoard is published.</p>}
        </section>}

        <section className={styles.connectCard}>
          <div><span className={styles.stepLabel}>{isPublished ? "02" : "03"} / CONNECT YOUR NOTES</span><h2>One last thing: pair your board.</h2><p>Sign in to Archeon, open <strong>Browser companion</strong> in the TackBoard sidebar, and generate a pairing key. Paste it into the extension window’s Settings (⚙). The extension never needs your account password.</p></div>
          <Link className={styles.secondary} href="/app/tackboard">Open TackBoard <ChevronRight size={16}/></Link>
        </section>
        <footer className={styles.footer}><span>ARCHEON / TACKBOARD</span><span>Browser-managed popups share their browser’s taskbar group. A system-wide always-on-top task corner requires a native desktop app.</span></footer>
      </div>
    </main>
  );
}
