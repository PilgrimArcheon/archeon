import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "text";
  className?: string;
  external?: boolean;
  download?: boolean;
  icon?: boolean;
};

export function ActionLink({ href, children, variant = "primary", className, external = false, download = false, icon = true }: Props) {
  const styles = {
    primary: "bg-accent text-[#11101c] hover:bg-accent-strong hover:text-white",
    secondary: "border border-line bg-surface text-foreground hover:border-accent hover:bg-surface-alt",
    text: "px-0 text-accent hover:text-accent-strong",
  };
  const classes = cn(
    "inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full px-6 text-sm font-semibold transition-colors duration-200",
    styles[variant],
    className,
  );
  const content = <>{children}{icon && <ArrowUpRight className="h-4 w-4" aria-hidden="true" />}</>;
  if (external || download || href.startsWith("mailto:")) {
    return <a className={classes} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} download={download || undefined}>{content}</a>;
  }
  return <Link href={href} className={classes}>{content}</Link>;
}
