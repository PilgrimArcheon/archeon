export const feedbackCategories = ["question", "bug", "feature", "app_request"] as const;
export type FeedbackCategory = typeof feedbackCategories[number];
export const feedbackSources = ["archeon", "tackboard", "invoice", "pocketline", "gatherly", "portfolio", "apps"] as const;
export function feedbackSource(value: unknown): string {
  return typeof value === "string" && (feedbackSources as readonly string[]).includes(value) ? value : "archeon";
}
export const faqItems = [
  { q: "Is one Archeon account enough for all apps?", a: "Yes. The web apps use a shared Archeon account. Some features also work without signing in." },
  { q: "How does TackBoard sync?", a: "Signed-in web edits are saved to your personal cloud workspace. Desktop companions use a pairing key from the web app and show the same cloud boards." },
  { q: "Will connecting TackBoard Desktop replace my local notes?", a: "Yes. Desktop pairing loads your cloud version. Export local notes first if you need to keep a copy of anything made before connecting." },
  { q: "Can I create invoices without an account?", a: "Invoice Studio offers guest PDF creation. Sign in with Archeon to keep invoices, clients, and payment tracking in your workspace." },
  { q: "What if I find a bug or want a new app?", a: "Use the support form and choose Bug report, Feature request or Request an app. The message goes into our private feedback inbox." },
  { q: "How can I recover access to my account?", a: "Automated password recovery is not available yet. Contact support, but never send a password, session token, or pairing key." },
];
