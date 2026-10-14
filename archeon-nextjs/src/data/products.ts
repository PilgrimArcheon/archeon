/** Product showcase registry. Product demos may be local Next.js app routes. */
export type ProductSlug = "pocketline" | "tackboard" | "gatherly";
export type Product = {
  slug: ProductSlug;
  number: string;
  name: string;
  category: string;
  tagline: string;
  problem: string;
  solution: string;
  audience: string;
  standout: string;
  journey: string[];
  screens: string[];
  accent: "green" | "blue" | "coral";
  demoUrl?: string; // A usable route; external deployments should be verified before linking.
  status: "in-development" | "mvp" | "live";
};
export const products: Product[] = [
  {
    slug: "pocketline", number: "01", name: "Pocketline", category: "PERSONAL FINANCE",
    tagline: "Give every paycheck a plan.",
    problem: "People know what they earn, but often lose track of what is safe to spend between paydays.",
    solution: "A calm, mobile-first budget workspace that splits income into essentials, goals, and flexible spending and makes the next decision obvious.",
    audience: "Students, freelancers, and anyone managing a personal monthly budget.",
    standout: "A prominent safe-to-spend balance with a clear explanation of the numbers behind it.",
    journey: ["Set monthly income and currency", "Allocate money across three simple buckets", "Record an expense in two taps", "See what remains and adjust the plan"],
    screens: ["Payday onboarding", "Spending dashboard", "Add expense", "Savings goals"],
    accent: "green", status: "in-development"
  },
  {
    slug: "tackboard", number: "02", name: "TackBoard", category: "PRODUCTIVITY & TEAMWORK",
    tagline: "Make a note. Make some progress. Peel it away.",
    problem: "Most task managers are heavier than the job. Small ideas and daily tasks get buried behind complicated planning systems.",
    solution: "A tactile, lightweight sticky-note taskboard. Make boards for projects, write little checklists, move notes around and peel them away when everything's done.",
    audience: "Individuals, makers, students, and small teams who think better with a visible board.",
    standout: "A physical sticky-note feeling: layered paper cards, a satisfying checklist strike-through and an animated peel-away into Completed.",
    journey: ["Open a personal board instantly, no sign-up", "Create a colored sticky note with checklist tasks", "Drag notes, change statuses and tick tasks", "Watch completed notes peel away, then restore from Completed"],
    screens: ["Workspace & boards", "Sticky-note editor", "Interactive taskboard", "Completed & restore"],
    accent: "blue", status: "mvp", demoUrl: "/app/tackboard"
  },
  {
    slug: "gatherly", number: "03", name: "Gatherly", category: "EVENTS & COMMUNITY",
    tagline: "Bring people together. Skip the chaos.",
    problem: "Organizing a small gathering across chats and spreadsheets makes invitations, responses, and plans difficult to manage.",
    solution: "A shareable event page with invitations, simple RSVP collection, and a clear host overview.",
    audience: "Friends, community organizers, and small event hosts.",
    standout: "One beautiful invitation link that doubles as the source of truth for hosts and guests.",
    journey: ["Create an event with date and details", "Choose an invitation theme", "Share a link and collect RSVPs", "Track responses from a single guest list"],
    screens: ["Event creator", "Public invitation", "Guest RSVP", "Host guest list"],
    accent: "coral", status: "in-development"
  }
];
export const findProduct = (slug: string) => products.find((product) => product.slug === slug);
