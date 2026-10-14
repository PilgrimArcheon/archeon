import { redirect } from "next/navigation";

/** About Me now lives on the main Archeon homepage. Preserve old bookmarks. */
export default function AboutPage() {
  redirect("/#about");
}
