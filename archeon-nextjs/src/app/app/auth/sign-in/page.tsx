import type { Metadata } from "next";
import AccountClient from "./AccountClient";
export const metadata: Metadata = { title: "Sign in or create an account | Archeon", robots: { index: false, follow: false } };
export default function SignInPage() { return <AccountClient/>; }
