import type { Metadata } from "next";
import { PlatformHome } from "@/components/platform/PlatformHome";

export const metadata: Metadata = {
  title: "Archeon",
  description: "Meet Pilgrim, a gameplay programmer and product designer creating interactive worlds, thoughtful products and useful apps at Archeon.",
};

export default function HomePage() {
  return <PlatformHome />;
}
