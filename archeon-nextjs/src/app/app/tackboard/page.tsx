import type { Metadata } from "next";
import TackboardClient from "./TackboardClient";

export const metadata: Metadata = {
  title: "TackBoard",
  icons: { icon: "/images/tackboard-icon.png" },
  description: "A lightweight sticky-note taskboard. Make projects, check off tasks, arrange notes and peel away what you've finished. Use it without an account or sign in to synchronize projects across devices.",
};

export default function TackboardPage() { return <TackboardClient />; }
