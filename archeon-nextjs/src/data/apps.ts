import { archeonApps } from "@/features/apps/registry";

/** @deprecated The canonical registry is @/features/apps/registry. */
export type PortfolioApp = {
  slug: string;
  name: string;
  description: string;
  href: string;
  status: "live" | "beta";
  tags: string[];
};

export const apps: PortfolioApp[] = archeonApps.map((app) => ({
  slug: app.slug,
  name: app.title,
  description: app.description,
  href: app.href,
  status: "live",
  tags: [app.category],
}));
