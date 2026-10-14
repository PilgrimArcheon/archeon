import type { Metadata } from "next";
import InvoiceClient from "./InvoiceClient";

export const metadata: Metadata = {
  title: "Free Invoice Creator | Archeon Apps",
  description: "Create, preview and download professional PDF invoices free. Sign in to save invoices, manage clients and track payments.",
};

export default function InvoicePage() {
  return <InvoiceClient />;
}
