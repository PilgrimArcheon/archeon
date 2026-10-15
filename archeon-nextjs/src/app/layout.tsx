import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Manrope } from "next/font/google";
import "./globals.css";
import "./classic.css";
import "./monochrome.css";
import "./platform.css";
import "./product-design.css";
import "./gamedev.css";
import "@/styles/archeon-app-tokens.css";
import { SiteShell } from "@/components/layout/SiteShell";
import { site } from "@/data/site";

const manrope = Manrope({ subsets: ["latin"], display: "swap", variable: "--font-manrope" });

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "archeon",
    template: "%s | archeon",
  },
  description: `${site.name} (${site.nickname}) — building software, digital tools, interactive experiences, games, and design.`,
  applicationName: "archeon",
  keywords: [
    "Archeon",
    "Pilgrim",
    "Shontan Daniel",
    "product design",
    "gameplay programmer",
    "Unity",
    "C#",
    "game developer",
    "portfolio",
  ],
  openGraph: {
    title: "archeon: Creative technologist & builder",
    description:
      "Ideas, code, design and interactive experiences. Explore the world of Archeon.",
    type: "website",
    images: ["/images/og-cover.png"],
  },
  icons: { icon: "/images/favicon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d0d0e",
};

const themeInit = `try{const t=localStorage.getItem('archeon-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}`;

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={manrope.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
