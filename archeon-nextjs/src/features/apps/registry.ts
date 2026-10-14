/** Add future first-party tools here; each app lives at /app/<slug>. */
export type ArcheonApp = {
  slug: string;
  title: string;
  category: string;
  description: string;
  href: `/app/${string}`;
  privacy: "Private" | "Public";
  release?: "MVP";
};

export const archeonApps: ArcheonApp[] = [
  {
    slug: "invoice",
    title: "Invoice Studio",
    category: "FINANCE & OPERATIONS",
    description: "Create invoices, manage clients, record deposits and payments, and send polished PDFs.",
    href: "/app/invoice",
    privacy: "Private",
  },
  {
    slug: "tackboard",
    title: "TackBoard",
    category: "PRODUCTIVITY",
    description: "A tactile taskboard for sticky notes, checklists and projects. Work locally or sign in to sync across devices.",
    href: "/app/tackboard",
    privacy: "Public",
    release: "MVP",
  },
];
