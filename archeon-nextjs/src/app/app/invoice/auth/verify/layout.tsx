import type { Metadata } from "next";
import type { ReactNode } from "react";

// One-time tokens in query strings must not appear in crawler indexes or referrers.
export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function VerifyLayout({ children }: { children: ReactNode }) { return children; }
