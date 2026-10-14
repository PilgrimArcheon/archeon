import { z } from "zod";

const txt = (n = 200) => z.string().trim().max(n);
const amount = z.number().finite().min(0).max(10_000_000_000);

export const clientSchema = z.object({
  id: z.string().uuid(),
  name: txt(150).min(1),
  company: txt(150).default(""),
  email: z.union([z.email().max(250), z.literal("")]),
  phone: txt(50).default(""),
  address: txt(1200).default(""),
});
export type Client = z.infer<typeof clientSchema>;

export const companySchema = z.object({
  businessName: txt(160).min(1),
  contactName: txt(120).default(""),
  email: z.union([z.email(), z.literal("")]),
  phone: txt(60).default(""),
  address: txt(1200).default(""),
  website: txt(250).default(""),
  bankName: txt(120).default(""),
  accountName: txt(120).default(""),
  accountNumber: txt(100).default(""),
  paymentInstructions: txt(1200).default(""),
  footerNote: txt(1000).default("Thank you for your business."),
  accent: z.string().regex(/^#[a-fA-F0-9]{6}$/).default("#5359E8"),
  template: z.enum(["classic", "minimal", "modern"]).default("classic"),
  fontStyle: z.enum(["sans", "serif", "mono"]).default("sans"),
  density: z.enum(["comfortable", "compact"]).default("comfortable"),
  tableStyle: z.enum(["striped", "lined", "plain"]).default("striped"),
});
export type Company = z.infer<typeof companySchema>;

export const DEFAULT_COMPANY: Company = {
  businessName: "", contactName: "", email: "", phone: "",
  address: "", website: "", bankName: "", accountName: "", accountNumber: "",
  paymentInstructions: "", footerNote: "Thank you for your business.", accent: "#5359E8",
  template: "classic", fontStyle: "sans", density: "comfortable", tableStyle: "striped",
};

export const itemSchema = z.object({
  id: z.string().uuid(), description: txt(250).min(1), detail: txt(500).default(""),
  quantity: z.number().finite().positive().max(100_000), unitPrice: amount,
  upfrontExtra: z.boolean().default(false),
});
export type InvoiceItem = z.infer<typeof itemSchema>;

export const invoiceSchema = z.object({
  id: z.string().uuid(), invoiceNo: txt(40), projectName: txt(180).min(1),
  client: clientSchema, issueDate: z.iso.date(), dueDate: z.iso.date(),
  currency: z.enum(["NGN", "USD", "GBP", "EUR"]),
  items: z.array(itemSchema).min(1).max(60),
  depositPercent: z.number().finite().min(0).max(100),
  discount: amount, taxRate: z.number().finite().min(0).max(100),
  paidAmount: amount,
  paymentTerms: txt(1200).default("Payment is due by the date shown on this invoice."),
  notes: txt(2500).default(""),
  status: z.enum(["draft", "sent"]).default("draft"),
  sentAt: z.string().default(""),
  /** When the final payment was recorded. Empty for incomplete or legacy invoices. */
  paidAt: z.union([z.iso.datetime({ offset: true }), z.literal("")]).default(""),
});
export type Invoice = z.infer<typeof invoiceSchema>;

/** Format dates using the visitor's calendar day, not UTC (which can be a day off). */
export function localISODate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const money = (n: number, currency: Invoice["currency"] = "NGN") =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(n);

export function calculateInvoice(invoice: Pick<Invoice, "items" | "depositPercent" | "discount" | "taxRate" | "paidAmount">) {
  const round = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
  const subtotal = round(invoice.items.reduce((n, i) => n + i.quantity * i.unitPrice, 0));
  const discount = Math.min(invoice.discount, subtotal);
  const taxable = subtotal - discount;
  const tax = round(taxable * invoice.taxRate / 100);
  const total = round(taxable + tax);
  const extras = round(invoice.items.filter(i => i.upfrontExtra).reduce((n, i) => n + i.quantity * i.unitPrice, 0));
  const projectBase = Math.max(0, subtotal - extras);
  const projectDeposit = round(projectBase * invoice.depositPercent / 100);
  const upfront = Math.min(total, round(projectDeposit + extras));
  const finalPayment = round(total - upfront);
  const outstanding = Math.max(0, round(total - invoice.paidAmount));
  return { subtotal, discount, tax, total, extras, projectBase, projectDeposit, upfront, finalPayment, outstanding };
}

/** Never issue a paid receipt for a zero-value or partly paid invoice. */
export function isInvoicePaid(invoice: Invoice): boolean {
  const totals = calculateInvoice(invoice);
  return totals.total > 0 && totals.outstanding <= 0;
}

export function receiptReference(invoice: Pick<Invoice, "id" | "invoiceNo" | "issueDate">): string {
  // Reference is stable for a saved invoice, independent of PDF generation date.
  return `RCPT-${invoiceReference(invoice).replace(/^INV-/i, "")}`;
}

export function getInvoiceStatus(invoice: Invoice, today = localISODate()) {
  const totals = calculateInvoice(invoice);
  if (totals.outstanding <= 0 && totals.total > 0) return "paid";
  if (invoice.paidAmount > 0) return "partial";
  if (invoice.status === "sent" && invoice.dueDate < today) return "overdue";
  return invoice.status;
}

export const newItem = (): InvoiceItem => ({
  id: crypto.randomUUID(), description: "", detail: "", quantity: 1, unitPrice: 0, upfrontExtra: false,
});

export const SAMPLE_CLIENT: Client = {
  id: "98024a72-d8ea-4b24-a074-7d12dbd8d3e6", name: "", company: "",
  email: "", phone: "", address: "",
};
// Internal status does not appear on the client-facing PDF. Guest and unsaved
// invoices always have a stable reference derived from their unique ID.
export function invoiceReference(invoice: Pick<Invoice, "id" | "invoiceNo" | "issueDate">): string {
  if (invoice.invoiceNo.trim()) return invoice.invoiceNo.trim();
  return `INV-${invoice.issueDate.slice(0, 4)}-${invoice.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}
export function sampleInvoice(): Invoice {
  const now = localISODate();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);
  const due = localISODate(dueDate);
  return {
    id: crypto.randomUUID(), invoiceNo: "", projectName: "General services",
    client: { ...SAMPLE_CLIENT, id: crypto.randomUUID(), name: "Example Customer" }, issueDate: now, dueDate: due, currency: "NGN",
    items: [{ ...newItem(), description: "Service fee", detail: "Services provided", unitPrice: 1000 }],
    depositPercent: 0, discount: 0, taxRate: 0, paidAmount: 0,
    paymentTerms: "Payment is due by the date shown on this invoice.",
    notes: "", status: "draft", sentAt: "", paidAt: "",
  };
}

export function emptyInvoice(client: Client): Invoice {
  return { ...sampleInvoice(), id: crypto.randomUUID(), projectName: "", client: { ...client }, items: [newItem()] };
}
