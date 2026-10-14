import type { Metadata } from "next";
import { ClassicContact } from "@/components/classic/ClassicHome";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${site.name} for a project or collaboration.`,
};

export default function ContactPage() {
  return <div className="original-site main" style={{ paddingTop: "2rem" }}><ClassicContact /></div>;
}
