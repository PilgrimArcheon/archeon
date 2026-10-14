import { redirect } from "next/navigation";
export default function LegacyInvoiceMagicLink() { redirect("/app/auth/sign-in?next=%2Fapp%2Finvoice"); }
