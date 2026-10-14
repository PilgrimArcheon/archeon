import { redirect, notFound } from "next/navigation";
import { currentAccount } from "@/features/auth/server";
import { loadCompany, loadInvoice, badId } from "@/features/invoice/server";
import { invoiceReference, isInvoicePaid } from "@/features/invoice/models";
import EmailComposer from "./EmailComposer";

export const dynamic = "force-dynamic";
export default async function InvoiceEmailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ document?: string }> }) {
  const account = await currentAccount().catch(() => null);
  if (!account) redirect("/app/invoice");
  const { id } = await params;
  if (badId(id)) notFound();
  const invoice = await loadInvoice(id, account.workspaceId);
  if (!invoice) notFound();
  const company = await loadCompany(account.workspaceId, account.email);
  const documentType = (await searchParams).document === "receipt" && isInvoicePaid(invoice) ? "receipt" : "invoice";
  return <EmailComposer documentType={documentType} invoiceId={invoice.id} invoiceNo={invoiceReference(invoice)}
    to={invoice.client.email} client={invoice.client.name}
    business={company.businessName || account.email} />;
}
