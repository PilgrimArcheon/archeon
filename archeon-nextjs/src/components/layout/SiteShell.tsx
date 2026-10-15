"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GlobalThemeControl } from "@/components/theme/GlobalThemeControl";

/** Applications own their interface; the portfolio keeps its original chrome. */
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isApp = pathname === "/app" || pathname.startsWith("/app/");

  if (isApp) {
    const hasOwnTheme = pathname === "/app/tackboard" || pathname === "/app/invoice";
    return <><main id="main-content">{children}</main>{!hasOwnTheme && <GlobalThemeControl/>}</>;
  }

  return <>
    <Header />
    <main id="main-content">{children}</main>
    <Footer />
  </>;
}
