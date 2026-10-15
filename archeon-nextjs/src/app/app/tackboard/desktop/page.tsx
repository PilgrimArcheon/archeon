import type { Metadata } from "next";
import Link from "next/link";
import styles from "./desktop.module.css";

export const metadata: Metadata = {
  title: "TackBoard Desktop",
  description:
    "Small floating desktop sticky notes. Download TackBoard for Windows or Mac and sync with your Archeon account.",
};

// TackBoard's signed-in GitHub account is not needed for public release assets.
// Pin to this tested prerelease so a future tag cannot silently change downloads.
const RELEASE_TAG = "tackboard-desktop-v0.6.0";
const RELEASE_REPO = "PilgrimArcheon/archeon-tackboard-desktop";
const RELEASE_PAGE = `https://github.com/${RELEASE_REPO}/releases/tag/${RELEASE_TAG}`;

type GitHubAsset = { name: string; browser_download_url: string };

type GitHubRelease = { assets?: GitHubAsset[] };

function secureDownload(value?: string): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}

function releaseAssetUrl(asset: GitHubAsset): string | null {
  const url = secureDownload(asset.browser_download_url);
  if (!url) return null;
  const parsed = new URL(url);
  const expectedPath = `/${RELEASE_REPO}/releases/download/${RELEASE_TAG}/`;
  if (parsed.hostname !== "github.com" || !parsed.pathname.startsWith(expectedPath)) {
    return null;
  }
  return url;
}

async function getReleaseAssets(): Promise<GitHubAsset[]> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${RELEASE_REPO}/releases/tags/${RELEASE_TAG}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "Archeon-TackBoard-Downloads",
        },
        // Cache successful release metadata to avoid excessive GitHub API calls.
        next: { revalidate: 600 },
      },
    );
    if (!response.ok) return [];
    const data: GitHubRelease = await response.json();
    if (!Array.isArray(data.assets)) return [];
    return data.assets.filter(
      (item): item is GitHubAsset =>
        !!item &&
        typeof item.name === "string" &&
        typeof item.browser_download_url === "string" &&
        !!releaseAssetUrl(item),
    );
  } catch {
    // The site still renders normally when GitHub is unavailable or private.
    return [];
  }
}

function findAsset(assets: GitHubAsset[], extension: string, arch?: string): string | null {
  const match = assets.find((asset) => {
    const name = asset.name.toLowerCase();
    if (!name.endsWith(extension)) return false;
    if (arch === "arm64") return /(?:^|[-_. ])arm64(?:[-_. ]|$)/i.test(name);
    if (arch === "x64") return /(?:^|[-_. ])x64(?:[-_. ]|$)/i.test(name);
    return true;
  });
  return match ? releaseAssetUrl(match) : null;
}

// Fetch at request time so changing the repository from private to public
// does not require a new Vercel deployment. The API result is cached for 10 min.
export const dynamic = "force-dynamic";

export default async function DesktopPage() {
  const assets = await getReleaseAssets();
  const platforms = [
    {
      name: "Windows",
      detail: "Windows 10/11 · x64",
      file: ".exe installer",
      url: findAsset(assets, ".exe") ??
        secureDownload(process.env.NEXT_PUBLIC_TACKBOARD_WINDOWS_DOWNLOAD_URL),
    },
    {
      name: "Mac · Apple Silicon",
      detail: "M1 / M2 / M3 / M4 and later",
      file: ".dmg disk image",
      url: findAsset(assets, ".dmg", "arm64") ??
        secureDownload(process.env.NEXT_PUBLIC_TACKBOARD_MAC_ARM64_DOWNLOAD_URL),
    },
    {
      name: "Mac · Intel",
      detail: "Intel-based Macs",
      file: ".dmg disk image",
      url: findAsset(assets, ".dmg", "x64") ??
        secureDownload(process.env.NEXT_PUBLIC_TACKBOARD_MAC_INTEL_DOWNLOAD_URL),
    },
  ];
  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.top}>
          <Link href="/app/tackboard">← TackBoard web app</Link>
          <span>ARCHEON / TACKBOARD.</span>
        </header>
        <section className={styles.hero}>
          <p className={styles.kicker}>TACKBOARD DESKTOP · WINDOWS + MAC</p>
          <h1>
            Just sticky notes.
            <br />
            <em>Right where you work.</em>
          </h1>
          <p className={styles.lead}>
            Keep colorful, editable sticky notes directly over your wallpaper,
            without a dashboard taking over your screen. Pick a board on the
            web, then check off tasks from your desktop.
          </p>
        </section>
        <section
          className={styles.downloads}
          aria-label="Choose desktop installer"
        >
          <div className={styles.sectionHead}>
            <h2>Download TackBoard</h2>
            <span>Choose your computer</span>
          </div>
          <div className={styles.options}>
            {platforms.map((item) => (
              <article className={styles.option} key={item.name}>
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.detail}</p>
                  <small>{item.file}</small>
                </div>
                {item.url ? (
                  <a
                    className={styles.action}
                    href={item.url}
                    rel="noopener noreferrer"
                  >
                    Download ↗
                  </a>
                ) : (
                  <span className={styles.pending}>Installer coming soon</span>
                )}
              </article>
            ))}
          </div>
          <p className={styles.notice}>
            <a href={RELEASE_PAGE} target="_blank" rel="noopener noreferrer">
              View official v0.6.0 prerelease and checksums ↗
            </a>{" "}·{" "}
            Version 0.6.0 is an unsigned preview. Windows SmartScreen and macOS
            Gatekeeper may warn or block installation. Mac installers still need
            real-device testing and Apple signing/notarization before general release.
            Download only from the official GitHub release.
          </p>
        </section>
        <section className={styles.steps}>
          <div className={styles.sectionHead}>
            <h2>Get started in three steps</h2>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <strong>Install and open TackBoard</strong>
                <p>
                  On Windows, run the installer. On Mac, open the DMG and drag
                  TackBoard to Applications. macOS may ask you to approve the
                  app if the build is not signed/notarized.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Pair your Archeon account</strong>
                <p>
                  Sign in to the web app, open <b>Desktop companion</b> and
                  generate a pairing key. In the desktop app, click the gear
                  icon and paste the key into <b>Account & cloud</b>.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Choose a board and a note size</strong>
                <p>
                  Select your board on the desktop home screen. Choose Small,
                  Medium or Large in Settings. You can create or rename a board
                  from the desktop board dropdown. Notes sync automatically
                  while the app runs in the tray or menu bar.
                </p>
              </div>
            </li>
          </ol>
          <Link className={styles.web} href="/app/tackboard">
            Open my web board ↗
          </Link>
        </section>
        <footer className={styles.footer}>
          TackBoard by Archeon · Your web boards and desktop notes share one
          account.
        </footer>
      </div>
    </main>
  );
}
