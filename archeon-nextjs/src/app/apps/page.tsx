import { redirect } from "next/navigation";

/** Legacy /apps bookmark kept functional; the canonical apps hub is /app. */
export default function LegacyAppsRedirect() {
  redirect("/app");
}
