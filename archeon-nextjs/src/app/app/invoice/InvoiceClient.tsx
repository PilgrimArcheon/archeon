"use client";

import Image from "next/image";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileClock,
  FilePlus2,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  Eye,
  LogOut,
  Mail,
  Menu,
  Pencil,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sun,
  Moon,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  type Client,
  type Company,
  type Invoice,
  type InvoiceItem,
  calculateInvoice,
  DEFAULT_COMPANY,
  emptyInvoice,
  getInvoiceStatus,
  money,
  newItem,
  sampleInvoice,
  invoiceReference,
  isInvoicePaid,
} from "@/features/invoice/models";

type Page = "overview" | "invoices" | "clients" | "settings";
type ApiResult<T> =
  | { success: true; data: T; error: false }
  | { success: false; data: null; error: { message: string } };

async function callApi<T>(
  url: string,
  method = "GET",
  payload?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}),
  });
  const data = (await response.json()) as ApiResult<T>;
  if (!response.ok || !data.success)
    throw new Error(!data.success ? data.error.message : "The request failed.");
  return data.data;
}
const humanDate = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
const clip = (value: string, len = 80) =>
  value.length > len ? `${value.slice(0, len)}…` : value;

function StatusPill({ invoice }: { invoice: Invoice }) {
  const state = getInvoiceStatus(invoice);
  if (state === "draft") return <span className="invoice-status-neutral">Not sent</span>;
  return (
    <span className={`status status-${state}`}>
      <span className="status-dot" />
      {state === "partial"
        ? "Part paid"
        : state.charAt(0).toUpperCase() + state.slice(1)}
    </span>
  );
}
function Spinner({ size = 18 }: { size?: number }) {
  return <LoaderCircle size={size} className="spin" />;
}
function Field({
  title,
  children,
  hint,
}: {
  title: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span className="field-label">{title}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function Empty({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: typeof FileText;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon size={25} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
function InvoiceDashboard() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [hasGuestDraft, setHasGuestDraft] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [company, setCompany] = useState<Company>({ ...DEFAULT_COMPANY });
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [page, setPage] = useState<Page>("overview");
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [clientEditor, setClientEditor] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentInput, setPaymentInput] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [busy, setBusy] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [dashboardCurrency, setDashboardCurrency] =
    useState<Invoice["currency"]>("NGN");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel("archeon_invoice_updates");
    channel.onmessage = (event: MessageEvent<{ type?: string; invoiceId?: string }>) => {
      const payload = event.data;
      if (!payload || payload.type !== "sent" || typeof payload.invoiceId !== "string") return;
      const sentAt = new Date().toISOString();
      setInvoices(previous => previous.map(item => item.id === payload.invoiceId ? { ...item, status: "sent", sentAt } : item));
      setEditing(previous => previous && previous.id === payload.invoiceId ? { ...previous, status: "sent", sentAt } : previous);
    };
    return () => channel.close();
  }, []);
  useEffect(() => {
    setTheme(
      document.documentElement.dataset.theme === "light" ? "light" : "dark",
    );
  }, []);
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("archeon-theme", next);
    } catch {
      /* local storage may be disabled */
    }
  }
  useEffect(() => {
    try {
      setHasGuestDraft(!!sessionStorage.getItem("archeon_invoice_guest_draft"));
    } catch {
      /* storage may be unavailable */
    }
  }, []);
  useEffect(() => {
    if (signedIn !== false || !editing) return;
    try {
      sessionStorage.setItem(
        "archeon_invoice_guest_draft",
        JSON.stringify(editing),
      );
      sessionStorage.setItem(
        "archeon_invoice_guest_company",
        JSON.stringify(company),
      );
      setHasGuestDraft(true);
    } catch {
      /* browser storage may be disabled */
    }
  }, [signedIn, editing, company]);
  const themeButton = (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title={`Use ${theme === "dark" ? "light" : "dark"} theme`}
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );

  const notify = (text: string) => {
    setMessage(text);
    setError("");
    window.setTimeout(() => setMessage(""), 5000);
  };
  const warn = (text: string) => {
    setError(text);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refresh = useCallback(async () => {
    const result = await callApi<{
      company: Company;
      clients: Client[];
      invoices: Invoice[];
      accountEmail: string;
    }>("/api/apps/invoice/bootstrap");
    setCompany(result.company);
    setClients(result.clients);
    setInvoices(result.invoices);
    setAccountEmail(result.accountEmail);
  }, []);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await callApi<{ signedIn: boolean }>(
          "/api/apps/invoice/session",
        );
        if (!active) return;
        setSignedIn(result.signedIn);
        if (result.signedIn) {
          await refresh();
          // Guests who register in the same browser tab can continue their draft.
          try {
            const stored = sessionStorage.getItem(
              "archeon_invoice_guest_draft",
            );
            if (stored) {
              const savedSender = sessionStorage.getItem("archeon_invoice_guest_company");
              if (savedSender) {
                const parsedSender = JSON.parse(savedSender) as Company;
                if (parsedSender && typeof parsedSender.businessName === "string") setCompany(parsedSender);
              }
              const parsed = JSON.parse(stored) as Invoice;
              setEditing({
                ...parsed,
                id: crypto.randomUUID(),
                invoiceNo: "",
                status: "draft",
                sentAt: "",
                paidAt: "",
              });
              setPage("invoices");
              sessionStorage.removeItem("archeon_invoice_guest_draft");
              sessionStorage.removeItem("archeon_invoice_guest_company");
            }
          } catch {
            /* ignore malformed or disabled session storage */
          }
        }
      } catch (e) {
        if (active) warn((e as Error).message);
      } finally {
        if (active) setSignedIn((s) => (s === null ? false : s));
      }
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  async function logout() {
    try {
      await fetch("/api/auth/session", {
        method: "DELETE",
        credentials: "same-origin",
      });
    } catch {
      /* preserve client state if network fails */
    }
    setSignedIn(false);
    setInvoices([]);
    setClients([]);
    setEditing(null);
    setPage("overview");
    setCompany({ ...DEFAULT_COMPANY });
    setAccountEmail("");
  }
  function validateInvoice(invoice: Invoice) {
    if (!invoice.projectName.trim()) throw new Error("Enter an invoice title or description.");
    if (!invoice.client.name.trim()) throw new Error("Enter the customer's name.");
    if (invoice.client.email && !/^\S+@\S+\.\S+$/.test(invoice.client.email))
      throw new Error("Enter a valid client email address or leave it blank.");
    if (
      !invoice.items.length ||
      invoice.items.some(
        (i) =>
          !i.description.trim() ||
          i.quantity <= 0 ||
          !Number.isFinite(i.unitPrice),
      )
    )
      throw new Error(
        "Add at least one valid line item with a description, quantity and price.",
      );
    if (!company.businessName.trim()) throw new Error("Enter your business or sender name.");
    if (company.email && !/^\S+@\S+\.\S+$/.test(company.email))
      throw new Error("Enter a valid sender email address or leave it blank.");
    if (invoice.paidAmount > calculateInvoice(invoice).total)
      throw new Error("Amount received cannot exceed the invoice total.");
  }
  async function generatedPdf(invoice: Invoice): Promise<Blob> {
    validateInvoice(invoice);
    const response = await fetch("/api/apps/invoice/guest/pdf", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoice, company }),
    });
    if (!response.ok) {
      const bad = await response.json().catch(() => null);
      throw new Error(bad?.error?.message || "Unable to generate the PDF.");
    }
    return response.blob();
  }
  async function preview() {
    if (!editing || busy) return;
    setBusy("preview");
    try {
      const blob = await generatedPdf(editing);
      setPreviewUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return URL.createObjectURL(blob);
      });
      setPreviewOpen(true);
    } catch (e) {
      warn((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  function changePage(next: Page) {
    setPage(next);
    setEditing(null);
    setMobileNav(false);
    setError("");
  }
  function continueDraft() {
    try {
      const invoice = sessionStorage.getItem("archeon_invoice_guest_draft");
      const sender = sessionStorage.getItem("archeon_invoice_guest_company");
      if (invoice) setEditing(JSON.parse(invoice) as Invoice);
      if (sender) setCompany(JSON.parse(sender) as Company);
    } catch {
      warn("Could not restore your earlier invoice. You can start a new one.");
    }
  }
  function startInvoice(example = false) {
    if (example && !company.businessName.trim()) setCompany({ ...company, businessName: "Example Business" });
    if (!signedIn) {
      try {
        sessionStorage.removeItem("archeon_invoice_guest_draft");
        sessionStorage.removeItem("archeon_invoice_guest_company");
      } catch {
        /* storage unavailable */
      }
      setHasGuestDraft(false);
    }
    setEditing(
      example
        ? sampleInvoice()
        : emptyInvoice(
            clients[0] || {
              id: crypto.randomUUID(),
              name: "",
              company: "",
              email: "",
              phone: "",
              address: "",
            },
          ),
    );
    setPage("invoices");
    setMobileNav(false);
    setError("");
  }
  function assignInvoice(saved: Invoice) {
    setInvoices((previous) => [
      saved,
      ...previous.filter((i) => i.id !== saved.id),
    ]);
    setEditing((previous) => previous?.id === saved.id ? saved : previous);
  }
  async function persistInvoice(invoice: Invoice): Promise<Invoice> {
    validateInvoice(invoice);
    const route = invoice.invoiceNo
      ? `/api/apps/invoice/invoices/${invoice.id}`
      : "/api/apps/invoice/invoices";
    const result = await callApi<Invoice>(
      route,
      invoice.invoiceNo ? "PUT" : "POST",
      invoice,
    );
    assignInvoice(result);
    return result;
  }
  async function trackInvoice(invoice: Invoice, action: "mark_sent" | "mark_unsent" | "record_payment" | "mark_paid", amount?: number) {
    if (busy || !invoice.invoiceNo) return;
    const stored = invoices.find((item) => item.id === invoice.id);
    if (editing?.id === invoice.id && stored && JSON.stringify(editing) !== JSON.stringify(stored)) {
      return warn("Save your invoice changes before updating its sent or payment status.");
    }
    const remaining = calculateInvoice(invoice).outstanding;
    if (action === "record_payment") {
      if (amount === undefined) {
        setPaymentInvoice(invoice);
        setPaymentInput("");
        setPaymentError("");
        return;
      }
      if (!Number.isFinite(amount) || amount <= 0 || amount > remaining) {
        setPaymentError("Enter an amount greater than zero and no more than the outstanding balance.");
        return;
      }
    }
    if (action === "mark_paid" && !window.confirm(`Mark ${invoice.invoiceNo} fully paid? This will record the outstanding ${money(remaining, invoice.currency)} as received.`)) return;
    if (action === "mark_unsent" && !window.confirm(`Change ${invoice.invoiceNo} back to Not sent?`)) return;
    setBusy(`track-${invoice.id}`);
    try {
      const updated = await callApi<Invoice>(`/api/apps/invoice/invoices/${invoice.id}/tracking`, "POST", { action, ...(amount === undefined ? {} : { amount }) });
      setInvoices((old) => old.map((i) => i.id === updated.id ? updated : i));
      setEditing((old) => old?.id === updated.id ? updated : old);
      setPaymentInvoice((old) => old?.id === updated.id ? null : old);
      setPaymentInput("");
      setPaymentError("");
      notify(action === "mark_sent" ? `${updated.invoiceNo} marked as sent (manual).` : action === "mark_unsent" ? `${updated.invoiceNo} marked as not sent.` : isInvoicePaid(updated) ? `${updated.invoiceNo} paid in full. Your payment receipt is ready.` : `Received payments updated for ${updated.invoiceNo}.`);
    } catch (e) {
      if (action === "record_payment") setPaymentError((e as Error).message);
      else warn((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  function downloadReceipt(invoice: Invoice) {
    if (!invoice.invoiceNo || !isInvoicePaid(invoice)) return warn("The invoice must be saved and fully paid before a receipt can be issued.");
    const stored = invoices.find(i => i.id === invoice.id);
    if (editing?.id === invoice.id && stored && JSON.stringify(editing) !== JSON.stringify(stored))
      return warn("Save your invoice changes before downloading the payment receipt.");
    const anchor = document.createElement("a");
    anchor.href = `/api/apps/invoice/invoices/${encodeURIComponent(invoice.id)}/receipt`;
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }
  function openReceiptEmail(invoice: Invoice) {
    if (!isInvoicePaid(invoice) || !invoice.invoiceNo) return warn("Record the final payment and save the invoice first.");
    if (!invoice.client.email) return warn("Add a client email address before emailing the receipt.");
    const stored = invoices.find(i => i.id === invoice.id);
    if (editing?.id === invoice.id && stored && JSON.stringify(editing) !== JSON.stringify(stored))
      return warn("Save your invoice changes before emailing its receipt.");
    window.open(`/app/invoice/email/${encodeURIComponent(invoice.id)}?document=receipt`, "_blank", "noopener,noreferrer");
  }
  function openEmailDraft(invoice: Invoice) {
    if (!invoice.client.email) return warn("Add a client email address and save the invoice first.");
    if (!invoice.invoiceNo) return warn("Save the invoice before opening the email composer.");
    const stored = invoices.find(i => i.id === invoice.id);
    if (editing?.id === invoice.id && stored && JSON.stringify(editing) !== JSON.stringify(stored)) return warn("Save your invoice changes before emailing its PDF.");
    const url = `/app/invoice/email/${encodeURIComponent(invoice.id)}`;
    // A dedicated page preserves the invoice editing state and opens in a new desktop tab.
    window.open(url, "_blank", "noopener,noreferrer");
  }
  async function save() {
    if (!editing || busy) return;
    setBusy("save");
    try {
      const saved = await persistInvoice(editing);
      notify(`${saved.invoiceNo} saved.`);
    } catch (e) {
      warn((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function download() {
    if (!editing || busy) return;
    setBusy("download");
    try {
      // Preview and download never require a saved invoice or an account.
      const pdf = await generatedPdf(editing);
      const url = URL.createObjectURL(pdf);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${invoiceReference(editing).replace(/[^a-z0-9_-]/gi, "-")}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 12000);
      notify("Your PDF is ready. No account required.");
    } catch (e) {
      warn((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function deleteInvoice(invoice: Invoice) {
    if (
      !window.confirm(
        `Permanently delete ${invoice.invoiceNo}? This does not recall any emails already sent.`,
      )
    )
      return;
    setBusy(`delete-${invoice.id}`);
    try {
      await callApi(`/api/apps/invoice/invoices/${invoice.id}`, "DELETE");
      setInvoices((old) => old.filter((i) => i.id !== invoice.id));
      if (editing?.id === invoice.id) setEditing(null);
      notify("Invoice deleted.");
    } catch (e) {
      warn((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function saveClient() {
    if (!clientEditor || busy) return;
    setBusy("client");
    try {
      const existing = clients.some((c) => c.id === clientEditor.id);
      const saved = await callApi<Client>(
        existing
          ? `/api/apps/invoice/clients/${clientEditor.id}`
          : "/api/apps/invoice/clients",
        existing ? "PUT" : "POST",
        clientEditor,
      );
      setClients((old) => [saved, ...old.filter((c) => c.id !== saved.id)]);
      setShowClientModal(false);
      setClientEditor(null);
      notify("Client saved.");
    } catch (e) {
      warn((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function removeClient(client: Client) {
    if (
      !window.confirm(
        `Remove ${client.name} from your client list? Existing invoices will keep their client details.`,
      )
    )
      return;
    try {
      await callApi(`/api/apps/invoice/clients/${client.id}`, "DELETE");
      setClients((old) => old.filter((c) => c.id !== client.id));
      notify("Client removed.");
    } catch (e) {
      warn((e as Error).message);
    }
  }
  async function saveSettings() {
    if (busy) return;
    setBusy("settings");
    try {
      const saved = await callApi<Company>(
        "/api/apps/invoice/settings",
        "PUT",
        company,
      );
      setCompany(saved);
      notify("Business details updated.");
    } catch (e) {
      warn((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  function openClient(client?: Client) {
    setClientEditor(
      client
        ? { ...client }
        : {
            id: crypto.randomUUID(),
            name: "",
            company: "",
            email: "",
            phone: "",
            address: "",
          },
    );
    setShowClientModal(true);
  }

  const metrics = useMemo(() => {
    const matching = invoices.filter((i) => i.currency === dashboardCurrency);
    const billed = matching.reduce(
      (sum, i) => sum + calculateInvoice(i).total,
      0,
    );
    const outstanding = matching.reduce(
      (sum, i) => sum + calculateInvoice(i).outstanding,
      0,
    );
    const received = matching.reduce(
      (sum, i) => sum + Math.min(i.paidAmount, calculateInvoice(i).total),
      0,
    );
    return {
      billed,
      outstanding,
      received,
      sent: invoices.filter((i) => i.status === "sent").length,
    };
  }, [invoices, dashboardCurrency]);
  const filtered = useMemo(
    () =>
      invoices.filter((i) => {
        const matches = [
          i.invoiceNo,
          i.projectName,
          i.client.name,
          i.client.company,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());
        return matches && (filter === "all" || getInvoiceStatus(i) === filter);
      }),
    [invoices, query, filter],
  );

  const previewModal = previewOpen && previewUrl && (
    <div
      className="pdf-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Invoice PDF preview"
    >
      <div className="pdf-modal-head">
        <b>Invoice preview</b>
        <button
          className="btn btn-outline"
          onClick={() => setPreviewOpen(false)}
        >
          <X size={17} /> Close
        </button>
      </div>
      <iframe title="PDF invoice preview" src={previewUrl} />
    </div>
  );

  if (signedIn === null)
    return (
      <div className="loading-screen">
        <div className="app-mark">
          a<span>.</span>
        </div>
        <Spinner size={24} />
      </div>
    );
  if (!signedIn && editing)
    return (
      <div className="guest-workspace">
        <div className="guest-topbar">
          <a href="/app" className="invoice-wordmark">
            <Image src="/images/invoice-studio-icon.svg" width={30} height={30} alt="" />
            <strong>Invoice Studio</strong>
          </a>
          <div>
            <span className="guest-mode-label">
              GUEST MODE · DOWNLOAD READY-TO-SEND INVOICES
            </span>
            {themeButton}
            <button
              className="btn btn-outline"
              onClick={() => setEditing(null)}
            >
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
        <div className="guest-content">
          {message && <div className="notice success">{message}</div>}
          {error && (
            <div className="notice danger" role="alert">
              {error}
            </div>
          )}
          <div className="guest-banner">
            <div>
              <b>Free invoice creator</b>
              <p>
                Preview and download without signing in. Create a free account
                to store invoices and track payments.
              </p>
            </div>
            <button
              className="btn btn-outline"
              onClick={() => setEditing(null)}
            >
              Create free account <ArrowRight size={15} />
            </button>
          </div>
          <InvoiceEditor
            invoice={editing}
            setInvoice={setEditing}
            company={company}
            setCompany={setCompany}
            clients={[]}
            busy={busy}
            guest
            onPreview={preview}
            onSave={() => {
              setEditing(null);
            }}
            onDownload={download}
            onAddClient={() => {
              setEditing(null);
            }}
          />
        </div>
        {previewModal}
      </div>
    );
  if (!signedIn)
    return (
      <div className="login-scene">
        <header className="login-header">
          <a
            href="/app"
            className="invoice-wordmark"
            aria-label="Archeon apps homepage"
          >
            <Image src="/images/invoice-studio-icon.svg" width={30} height={30} alt="" />
            <strong>Invoice Studio</strong>
          </a>
          <div className="login-header-actions">
            {themeButton}
            <a href="/app" className="login-back">
              <ArrowLeft size={15} /> All apps
            </a>
          </div>
        </header>
        <div className="login-grid">
          <section className="login-intro">
            <div className="login-kicker">
              <span className="kicker-dot" /> ARCHEON TOOLS / 001
            </div>
            <h1>
              Less paperwork.
              <br />
              <em>More creating.</em>
            </h1>
            <p>
              Create professional invoices in minutes. No account needed to get
              started. A free account saves your work and unlocks client and
              payment tracking.
            </p>
            <div className="login-feature-list">
              <span>
                <FileText size={16} /> PDF preview & download
              </span>
              <span>
                <ShieldCheck size={16} /> No signup to create
              </span>
              <span>
                <Wallet size={16} /> Free saved workspace
              </span>
            </div>
            <div className="login-index">
              01 — INVOICE STUDIO <span>FOR BUSINESSES & INDIVIDUALS</span>
            </div>
          </section>
          <section
            className="login-card"
            aria-label="Create or sign in to Archeon"
          >
            <div className="login-card-top">
              <span className="login-icon">
                <FileText size={19} />
              </span>
              <span className="login-card-index">
                FREE TO USE / YOUR WORKSPACE
              </span>
            </div>
            <div className="eyebrow">START IN SECONDS</div>
            <h2>
              Your next invoice<span className="title-dot">.</span>
            </h2>
            <p>
              Start creating right now. No login, card details or approval
              required.
            </p>
            <button
              className="btn btn-primary btn-wide"
              onClick={() => startInvoice(false)}
            >
              <Plus size={17} /> Create invoice — free
            </button>
            {hasGuestDraft && (
              <button
                className="btn btn-outline btn-wide guest-sample-btn"
                onClick={continueDraft}
              >
                Continue your invoice <ArrowRight size={16} />
              </button>
            )}
            <button
              className="btn btn-outline btn-wide guest-sample-btn"
              onClick={() => startInvoice(true)}
            >
              Try a sample invoice <ArrowRight size={16} />
            </button>
            <div className="guest-login-divider">
              <span>OR SAVE YOUR WORK WITH A FREE ACCOUNT</span>
            </div>
            <a href="/app/auth/sign-in?mode=register&next=%2Fapp%2Finvoice" className="btn btn-primary btn-wide invoice-shared-auth">Create an Archeon account <ArrowRight size={16}/></a>
            <a href="/app/auth/sign-in?mode=login&next=%2Fapp%2Finvoice" className="btn btn-outline btn-wide invoice-shared-auth">Sign in to my account <ArrowRight size={16}/></a>
            <div className="login-foot">
              <ShieldCheck size={15} /> Each account has its own private workspace.
              Email verification and password recovery are not available yet.
            </div>
          </section>
        </div>
        <footer className="login-attribution">
          <span>© {new Date().getFullYear()} ARCHEON</span>
          <span>Invoice Studio · Built by archeon.</span>
        </footer>
      </div>
    );

  const title = editing
    ? editing.invoiceNo || "Create invoice"
    : (
        {
          overview: "Overview",
          invoices: "Invoices",
          clients: "Clients",
          settings: "Business settings",
        } as const
      )[page];
  return (
    <div className="shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark"><Image src="/images/invoice-studio-icon.svg" width={33} height={33} alt="" /></span>
          <div>
            <strong>Invoice Studio</strong>
            <small>BUILT BY ARCHEON</small>
          </div>
        </div>
        <a href="/app" className="apps-back-link">
          <ArrowLeft size={15} /> All apps
        </a><a href="/app/support?source=invoice" className="apps-back-link"><FileText size={15}/> Invoice support</a>
        <div className="sidebar-label">WORKSPACE</div>
        <nav>
          {(
            [
              ["overview", LayoutDashboard, "Overview"],
              ["invoices", FileText, "Invoices"],
              ["clients", Users, "Clients"],
              ["settings", Settings2, "Settings"],
            ] as const
          ).map(([route, Icon, label]) => (
            <button
              key={route}
              className={`nav-link ${page === route ? "selected" : ""}`}
              onClick={() => changePage(route)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {route === "invoices" && !!invoices.length && (
                <b className="nav-count">{invoices.length}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-tip">
          <div className="tip-spark">↗</div>
          <b>Make it official.</b>
          <p>
            Create polished invoices and download them to share with your clients.
          </p>
          <button onClick={() => startInvoice(false)}>
            New invoice <ArrowRight size={14} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <div className="avatar">
            {company.businessName.charAt(0).toUpperCase()}
          </div>
          <div className="profile">
            <b>{clip(company.businessName, 19)}</b>
            <small>{accountEmail || "Signed-in creator"}</small>
          </div>
          <button
            title="Sign out"
            className="icon-button logout"
            onClick={logout}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      {mobileNav && (
        <button
          aria-label="Close menu"
          className="mobile-overlay"
          onClick={() => setMobileNav(false)}
        />
      )}
      <div className="main-column">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobileNav(true)}
            >
              <Menu size={20} />
            </button>
            {editing ? (
              <button className="back-button" onClick={() => setEditing(null)}>
                <ArrowLeft size={18} /> All invoices
              </button>
            ) : (
              <div className="breadcrumb">
                Workspace <span>/</span> <b>{title}</b>
              </div>
            )}
          </div>
          <div className="topbar-right">
            {themeButton}
            <div className="today-chip">
              <Clock3 size={15} />{" "}
              {new Date().toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
            <div className="tiny-avatar">
              {company.businessName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="content">
          {message && (
            <div className="notice success">
              <CheckCircle2 size={19} />
              <span>{message}</span>
              <button onClick={() => setMessage("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {error && (
            <div className="notice danger">
              <Bell size={19} />
              <span>{error}</span>
              <button onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {editing ? (
            <InvoiceEditor
              invoice={editing}
              setInvoice={setEditing}
              company={company}
              setCompany={setCompany}
              onSaveAppearance={saveSettings}
              clients={clients}
              busy={busy}
              onSave={save}
              onPreview={preview}
              onDownload={download}
              onAddClient={() => openClient()}
              onTrack={trackInvoice}
              onEmail={openEmailDraft}
              onReceipt={downloadReceipt}
              onEmailReceipt={openReceiptEmail}
            />
          ) : (
            <>
              {page === "overview" && (
                <>
                  <div className="page-intro">
                    <div>
                      <div className="eyebrow">
                        INVOICE STUDIO / OVERVIEW{" "}
                        <span className="sparkle">✳</span>
                      </div>
                      <h1>
                        Your work, at a glance
                        <span className="title-dot">.</span>
                      </h1>
                      <p>
                        Track invoices, payments, and customer relationships.
                      </p>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => startInvoice()}
                    >
                      <Plus size={18} /> New invoice
                    </button>
                  </div>
                  <div className="hero-panel">
                    <div className="hero-decoration hero-a" />
                    <div className="hero-decoration hero-b" />
                    <div className="hero-copy">
                      <div className="hero-kicker">
                        <span /> INVOICE STUDIO · 001
                      </div>
                      <h2>
                        Make good work.
                        <br />
                        <em>Get paid for it.</em>
                      </h2>
                      <p>
                        From your first proposal to the final payment, keep
                        every invoice beautifully organized.
                      </p>
                      <div className="hero-actions">
                        <button
                          className="btn btn-white"
                          onClick={() => startInvoice()}
                        >
                          <FilePlus2 size={17} /> Create an invoice
                        </button>
                        <button
                          className="btn btn-ghost-white"
                          onClick={() => startInvoice(true)}
                        >
                          Try sample <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                    <div className="hero-paper">
                      <div className="mock-head">
                        <div className="mock-logo" /> INVOICE{" "}
                        <span>#INV-001</span>
                      </div>
                      <div className="mock-rule" />
                      <div className="mock-row">
                        <span /> <span />
                      </div>
                      <div className="mock-row">
                        <span /> <span />
                      </div>
                      <div className="mock-row">
                        <span /> <span />
                      </div>
                      <div className="mock-total">
                        TOTAL <b>₦807,000</b>
                      </div>
                      <div className="mock-stamp">
                        <Check size={18} />
                      </div>
                    </div>
                  </div>
                  <div className="currency-toolbar">
                    <span>VIEW FINANCIAL TOTALS IN</span>
                    <select
                      aria-label="Dashboard currency"
                      value={dashboardCurrency}
                      onChange={(e) =>
                        setDashboardCurrency(
                          e.target.value as Invoice["currency"],
                        )
                      }
                    >
                      <option value="NGN">NGN · Naira</option>
                      <option value="USD">USD · Dollar</option>
                      <option value="GBP">GBP · Pound</option>
                      <option value="EUR">EUR · Euro</option>
                    </select>
                  </div>
                  <div className="metric-grid">
                    <div className="metric-card">
                      <div className="metric-top">
                        <span className="metric-icon blue">
                          <CircleDollarSign size={19} />
                        </span>
                        <span>{dashboardCurrency} invoices</span>
                      </div>
                      <div className="metric-value">
                        {money(metrics.billed, dashboardCurrency)}
                      </div>
                      <div className="metric-bottom">
                        <TrendingUp size={14} /> Total billed in selected
                        currency
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-top">
                        <span className="metric-icon orange">
                          <Wallet size={19} />
                        </span>
                        <span>Outstanding ({dashboardCurrency})</span>
                      </div>
                      <div className="metric-value">
                        {money(metrics.outstanding, dashboardCurrency)}
                      </div>
                      <div className="metric-bottom">Unpaid balances</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-top">
                        <span className="metric-icon green">
                          <BadgeCheck size={19} />
                        </span>
                        <span>Payments received ({dashboardCurrency})</span>
                      </div>
                      <div className="metric-value">
                        {money(metrics.received, dashboardCurrency)}
                      </div>
                      <div className="metric-bottom">
                        Manually recorded payments
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-top">
                        <span className="metric-icon purple">
                          <Send size={19} />
                        </span>
                        <span>Invoices sent</span>
                      </div>
                      <div className="metric-value">
                        {metrics.sent}
                        <small> / {invoices.length}</small>
                      </div>
                      <div className="metric-bottom">Across all currencies</div>
                    </div>
                  </div>
                  <div className="section-heading">
                    <div>
                      <h2>Recent invoices</h2>
                      <p>Your latest billing activity</p>
                    </div>
                    <button
                      className="link-button"
                      onClick={() => changePage("invoices")}
                    >
                      View all invoices <ArrowRight size={16} />
                    </button>
                  </div>
                  <InvoiceTable
                    invoices={invoices.slice(0, 6)}
                    onEdit={setEditing}
                    onDelete={deleteInvoice}
                    onTrack={trackInvoice}
                    onEmail={openEmailDraft}
                    onReceipt={downloadReceipt}
                    onEmailReceipt={openReceiptEmail}
                    tracking={!!busy}
                    onNew={() => startInvoice()}
                  />
                  <div className="note-ribbon">
                    <ShieldCheck size={17} /> Your dashboard is private. PDFs
                    are produced server-side, and invoices are stored in your
                    database.
                  </div>
                </>
              )}
              {page === "invoices" && (
                <>
                  <div className="page-intro">
                    <div>
                      <div className="eyebrow">ALL YOUR BILLING</div>
                      <h1>
                        Invoices<span className="title-dot">.</span>
                      </h1>
                      <p>
                        Create, edit, download and share professional invoices.
                      </p>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => startInvoice()}
                    >
                      <Plus size={18} /> New invoice
                    </button>
                  </div>
                  <div className="list-container">
                    <div className="list-toolbar">
                      <div className="search-input">
                        <Search size={18} />
                        <input
                          placeholder="Search invoice, title or client..."
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </div>
                      <div className="select-wrap">
                        <select
                          value={filter}
                          onChange={(e) => setFilter(e.target.value)}
                        >
                          <option value="all">All statuses</option>
                          <option value="draft">Not sent</option>
                          <option value="sent">Sent</option>
                          <option value="partial">Part paid</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                        </select>
                        <ChevronDown size={16} />
                      </div>
                    </div>
                    <InvoiceTable
                      invoices={filtered}
                      onEdit={setEditing}
                      onDelete={deleteInvoice}
                      onTrack={trackInvoice}
                      onEmail={openEmailDraft}
                      onReceipt={downloadReceipt}
                      onEmailReceipt={openReceiptEmail}
                      tracking={!!busy}
                      onNew={() => startInvoice()}
                    />
                  </div>
                </>
              )}
              {page === "clients" && (
                <>
                  <div className="page-intro">
                    <div>
                      <div className="eyebrow">YOUR NETWORK</div>
                      <h1>
                        Clients<span className="title-dot">.</span>
                      </h1>
                      <p>Keep client details ready for your next invoice.</p>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => openClient()}
                    >
                      <Plus size={18} /> Add client
                    </button>
                  </div>
                  {clients.length ? (
                    <div className="client-grid">
                      {clients.map((client) => (
                        <div className="client-card" key={client.id}>
                          <div className="client-row">
                            <div className="client-avatar">
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="client-actions">
                              <button
                                className="icon-button"
                                aria-label="Edit client"
                                onClick={() => openClient(client)}
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                className="icon-button danger-hover"
                                aria-label="Remove client"
                                onClick={() => removeClient(client)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <h3>{client.name}</h3>
                          <p>{client.company || "Individual client"}</p>
                          <div className="client-email">
                            <Mail size={15} />
                            {client.email}
                          </div>
                          <div className="client-foot">
                            <span>
                              {
                                invoices.filter(
                                  (i) => i.client.id === client.id,
                                ).length
                              }{" "}
                              invoice(s)
                            </span>
                            <button
                              className="link-button"
                              onClick={() => {
                                setEditing(emptyInvoice(client));
                                setPage("invoices");
                              }}
                            >
                              Create invoice <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      icon={Users}
                      title="Your client list is empty"
                      text="Add your first client to keep billing details in one place."
                      action={
                        <button
                          className="btn btn-primary"
                          onClick={() => openClient()}
                        >
                          <Plus size={16} /> Add client
                        </button>
                      }
                    />
                  )}
                </>
              )}
              {page === "settings" && (
                <SettingsView
                  company={company}
                  setCompany={setCompany}
                  busy={busy}
                  onSave={saveSettings}
                />
              )}
            </>
          )}
          <div className="page-foot">
            © {new Date().getFullYear()} Invoice Studio <span>•</span> Built by archeon. <span>•</span> <a href="/app/support?source=invoice">Support</a>
          </div>
        </div>
      </div>
      {previewModal}
      {paymentInvoice && (
        <div className="modal-cover" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) setPaymentInvoice(null); }}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="record-payment-title">
            <div className="modal-heading">
              <div>
                <div className="eyebrow">MANUAL BOOKKEEPING</div>
                <h2 id="record-payment-title">Record payment</h2>
              </div>
              <button type="button" className="icon-button" aria-label="Close" disabled={!!busy} onClick={() => setPaymentInvoice(null)}><X size={20}/></button>
            </div>
            <p className="tracking-dialog-meta">
              {invoiceReference(paymentInvoice)} · {paymentInvoice.client.name}
            </p>
            <div className="tracking-dialog-totals">
              <span>Already received <b>{money(paymentInvoice.paidAmount, paymentInvoice.currency)}</b></span>
              <span>Balance remaining <b>{money(calculateInvoice(paymentInvoice).outstanding, paymentInvoice.currency)}</b></span>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const value = paymentInput.trim();
              if (!/^\d+(?:\.\d{1,2})?$/.test(value)) {
                setPaymentError("Enter a positive amount with at most two decimal places.");
                return;
              }
              void trackInvoice(paymentInvoice, "record_payment", Number(value));
            }}>
              <Field title={`Amount received (${paymentInvoice.currency})`} hint="Only record money actually received. This does not charge the client.">
                <input autoFocus required type="number" min="0.01" step="0.01" inputMode="decimal"
                  max={calculateInvoice(paymentInvoice).outstanding} placeholder="0.00"
                  value={paymentInput} onChange={(e) => { setPaymentInput(e.target.value); setPaymentError(""); }} />
              </Field>
              {paymentError && <p className="tracking-error" role="alert">{paymentError}</p>}
              <div className="modal-actions">
                <button type="button" className="btn btn-muted" disabled={!!busy} onClick={() => setPaymentInvoice(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!!busy}>
                  {busy ? <Spinner size={15}/> : <Check size={15}/>} Record payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showClientModal && clientEditor && (
        <div
          className="modal-cover"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowClientModal(false);
          }}
        >
          <div className="modal">
            <div className="modal-heading">
              <div>
                <div className="eyebrow">CLIENT DETAILS</div>
                <h2>
                  {clients.some((c) => c.id === clientEditor.id)
                    ? "Edit client"
                    : "Add a client"}
                </h2>
              </div>
              <button
                aria-label="Close"
                className="icon-button"
                onClick={() => setShowClientModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void saveClient();
              }}
            >
              <div className="form-grid">
                <Field title="Contact name *">
                  <input
                    required
                    value={clientEditor.name}
                    onChange={(e) =>
                      setClientEditor({ ...clientEditor, name: e.target.value })
                    }
                    placeholder="e.g. Alex Morgan"
                  />
                </Field>
                <Field title="Company">
                  <input
                    value={clientEditor.company}
                    onChange={(e) =>
                      setClientEditor({
                        ...clientEditor,
                        company: e.target.value,
                      })
                    }
                    placeholder="Company or organization (optional)"
                  />
                </Field>
                <Field title="Email address *">
                  <input
                    required
                    type="email"
                    value={clientEditor.email}
                    onChange={(e) =>
                      setClientEditor({
                        ...clientEditor,
                        email: e.target.value,
                      })
                    }
                    placeholder="alex@company.com"
                  />
                </Field>
                <Field title="Phone">
                  <input
                    value={clientEditor.phone}
                    onChange={(e) =>
                      setClientEditor({
                        ...clientEditor,
                        phone: e.target.value,
                      })
                    }
                    placeholder="+234 ..."
                  />
                </Field>
                <div className="span-two">
                  <Field title="Billing address">
                    <textarea
                      rows={3}
                      value={clientEditor.address}
                      onChange={(e) =>
                        setClientEditor({
                          ...clientEditor,
                          address: e.target.value,
                        })
                      }
                      placeholder="Street, city, country"
                    />
                  </Field>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-muted"
                  onClick={() => setShowClientModal(false)}
                >
                  Cancel
                </button>
                <button
                  disabled={busy !== ""}
                  type="submit"
                  className="btn btn-primary"
                >
                  {busy === "client" ? <Spinner /> : <Check size={17} />} Save
                  client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InvoiceTable({
  invoices,
  onEdit,
  onDelete,
  onNew,
  onTrack,
  onEmail,
  onReceipt,
  onEmailReceipt,
  tracking,
}: {
  invoices: Invoice[];
  onEdit: (i: Invoice) => void;
  onDelete: (i: Invoice) => void;
  onNew: () => void;
  onTrack: (i: Invoice, action: "mark_sent" | "mark_unsent" | "record_payment" | "mark_paid") => void;
  onEmail: (i: Invoice) => void;
  onReceipt: (i: Invoice) => void;
  onEmailReceipt: (i: Invoice) => void;
  tracking: boolean;
}) {
  if (!invoices.length)
    return (
      <Empty
        icon={FileClock}
        title="No invoices here yet"
        text="Once you create an invoice, it will appear here with its status and payment details."
        action={
          <button className="btn btn-primary" onClick={onNew}>
            <Plus size={16} /> Create an invoice
          </button>
        }
      />
    );
  return (
    <div className="table-scroll">
      <table className="invoice-table">
        <thead>
          <tr>
            <th>INVOICE</th>
            <th>CLIENT</th>
            <th>DATE</th>
            <th>AMOUNT</th>
            <th>STATUS</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} onClick={() => onEdit(invoice)}>
              <td>
                <strong>{invoiceReference(invoice)}</strong>
                <span>{clip(invoice.projectName, 30)}</span>
              </td>
              <td>
                <div className="table-client">
                  <span className="table-avatar">
                    {invoice.client.name.charAt(0).toUpperCase()}
                  </span>
                  {clip(invoice.client.name, 25)}
                </div>
              </td>
              <td>{humanDate(invoice.issueDate)}</td>
              <td className="amount-cell">
                {money(calculateInvoice(invoice).total, invoice.currency)}
                <span className="tracking-amount">Received: {money(invoice.paidAmount, invoice.currency)}</span>
              </td>
              <td>
                <StatusPill invoice={invoice} />
              </td>
              <td>
                <div className="row-menu">
                  <button className="tracking-action" disabled={tracking}
                    title={invoice.status === "sent" ? "Unmark sent" : "Confirm you sent this invoice outside Archeon"}
                    onClick={(e) => { e.stopPropagation(); onTrack(invoice, invoice.status === "sent" ? "mark_unsent" : "mark_sent"); }}>
                    {invoice.status === "sent" ? "Sent ✓" : "Mark sent"}
                  </button>
                  {calculateInvoice(invoice).outstanding > 0 && (
                    <>
                      <button className="tracking-action" disabled={tracking} title="Record a partial payment"
                        onClick={(e) => { e.stopPropagation(); onTrack(invoice, "record_payment"); }}>+ Payment</button>
                      <button className="tracking-action" disabled={tracking} title="Mark remaining balance as received"
                        onClick={(e) => { e.stopPropagation(); onTrack(invoice, "mark_paid"); }}>Mark paid</button>
                    </>
                  )}
                  {isInvoicePaid(invoice) && (
                    <>
                      <button className="tracking-action" title="Download final payment receipt" onClick={(e) => { e.stopPropagation(); onReceipt(invoice); }}>
                        <BadgeCheck size={14}/> Receipt PDF
                      </button>
                      {!!invoice.client.email && <button className="icon-button" title="Email payment receipt" aria-label="Email payment receipt"
                        onClick={(e) => { e.stopPropagation(); onEmailReceipt(invoice); }}><Mail size={16}/></button>}
                    </>
                  )}
                  {!!invoice.client.email && <button className="icon-button" title="Open invoice email composer in a new tab" aria-label="Open email composer"
                    onClick={(e) => { e.stopPropagation(); onEmail(invoice); }}><Mail size={16}/></button>}
                  <button
                    className="icon-button"
                    aria-label="Edit invoice"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(invoice);
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button danger-hover"
                    aria-label="Delete invoice"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(invoice);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InvoiceEditor({
  invoice,
  setInvoice,
  company,
  setCompany,
  clients,
  busy,
  guest = false,
  onPreview,
  onSave,
  onDownload,
  onAddClient,
  onTrack,
  onEmail,
  onReceipt,
  onEmailReceipt,
  onSaveAppearance,
}: {
  invoice: Invoice;
  setInvoice: (i: Invoice) => void;
  company: Company;
  clients: Client[];
  busy: string;
  guest?: boolean;
  setCompany?: (c: Company) => void;
  onPreview: () => void;
  onSave: () => void;
  onDownload: () => void;
  onAddClient: () => void;
  onTrack?: (i: Invoice, action: "mark_sent" | "mark_unsent" | "record_payment" | "mark_paid") => void;
  onEmail?: (i: Invoice) => void;
  onReceipt?: (i: Invoice) => void;
  onEmailReceipt?: (i: Invoice) => void;
  onSaveAppearance?: () => void;
}) {
  function patch<K extends keyof Invoice>(key: K, value: Invoice[K]) {
    setInvoice({ ...invoice, [key]: value });
  }
  function itemPatch(id: string, fields: Partial<InvoiceItem>) {
    patch(
      "items",
      invoice.items.map((i) => (i.id === id ? { ...i, ...fields } : i)),
    );
  }
  const totals = calculateInvoice(invoice);
  const multiple = invoice.items.length > 1;
  return (
    <>
      <div className="editor-title">
        <div>
          <div className="eyebrow">
            {invoice.invoiceNo ? "EDIT INVOICE" : "NEW INVOICE"}
          </div>
          <h1>
            {invoice.invoiceNo || "Create invoice"}
            <span className="title-dot">.</span>
          </h1>
          <p>
            Build your invoice, preview the result, and download a polished PDF.
          </p>
        </div>
        <div className="editor-actions">
          {!guest && (
            <button
              className="btn btn-muted"
              onClick={onSave}
              disabled={!!busy}
            >
              {busy === "save" ? <Spinner /> : <Check size={17} />} Save invoice
            </button>
          )}
          <button
            className="btn btn-outline"
            onClick={onPreview}
            disabled={!!busy}
          >
            {busy === "preview" ? <Spinner /> : <Eye size={17} />} Preview
          </button>
          <button
            className="btn btn-outline"
            onClick={onDownload}
            disabled={!!busy}
          >
            {busy === "download" ? <Spinner /> : <ArrowDownToLine size={17} />}{" "}
            Download PDF
          </button>
        </div>
      </div>
      {!guest && invoice.invoiceNo && onTrack && (
        <div className="tracking-toolbar">
          <span className="tracking-label">MANUAL TRACKING · No email is sent by these buttons</span>
          <span className="tracking-summary">Received {money(invoice.paidAmount, invoice.currency)} / {money(totals.total, invoice.currency)}</span>
          <button className="btn btn-outline" disabled={!!busy} onClick={() => onTrack(invoice, invoice.status === "sent" ? "mark_unsent" : "mark_sent")}>{invoice.status === "sent" ? <Check size={15} /> : <Send size={15} />}{invoice.status === "sent" ? "Sent ✓ (undo)" : "Mark as sent"}</button>
          {totals.outstanding > 0 && <button className="btn btn-outline" disabled={!!busy} onClick={() => onTrack(invoice, "record_payment")}><Plus size={15}/> Record payment</button>}
          {totals.outstanding > 0 && <button className="btn btn-primary" disabled={!!busy} onClick={() => onTrack(invoice, "mark_paid")}><Check size={15}/> Mark paid</button>}
          {isInvoicePaid(invoice) && onReceipt && (
            <button className="btn btn-primary" disabled={!!busy} onClick={() => onReceipt(invoice)}><BadgeCheck size={16}/> Download final receipt</button>
          )}
          {isInvoicePaid(invoice) && onEmailReceipt && invoice.client.email && (
            <button className="btn btn-outline" disabled={!!busy} onClick={() => onEmailReceipt(invoice)}><Mail size={15}/> Email receipt ↗</button>
          )}
          {onEmail && invoice.client.email && <button className="btn btn-muted" disabled={!!busy} onClick={() => onEmail(invoice)}><Mail size={15}/> Email invoice ↗</button>}
        </div>
      )}
      {setCompany && <details className="appearance-editor" open={false}>
        <summary><Settings2 size={17}/> Customize invoice design <span>Layout · Fonts · Colors · Table</span></summary>
        <AppearanceControls company={company} setCompany={setCompany}/>
        {onSaveAppearance && <button type="button" className="btn btn-outline" disabled={!!busy} onClick={onSaveAppearance}><Check size={15}/> Save appearance preferences</button>}
      </details>}
      <div className="editor-grid">
        <div className="editor-form">
          {guest && setCompany && (
            <section className="form-card">
              <div className="card-heading">
                <div className="card-icon">
                  <Banknote size={19} />
                </div>
                <div>
                  <h2>Sender details</h2>
                  <p>
                    Printed on your PDF. Not saved on Archeon in guest mode.
                  </p>
                </div>
              </div>
              <div className="form-grid">
                <Field title="Business or sender name *">
                  <input
                    value={company.businessName}
                    onChange={(e) =>
                      setCompany({ ...company, businessName: e.target.value })
                    }
                  />
                </Field>
                <Field title="Your email *">
                  <input
                    type="email"
                    value={company.email}
                    onChange={(e) =>
                      setCompany({ ...company, email: e.target.value })
                    }
                  />
                </Field>
                <Field title="Phone">
                  <input
                    value={company.phone}
                    onChange={(e) =>
                      setCompany({ ...company, phone: e.target.value })
                    }
                  />
                </Field>
                <Field title="Bank name">
                  <input
                    value={company.bankName}
                    onChange={(e) =>
                      setCompany({ ...company, bankName: e.target.value })
                    }
                  />
                </Field>
                <Field title="Account name">
                  <input
                    value={company.accountName}
                    onChange={(e) =>
                      setCompany({ ...company, accountName: e.target.value })
                    }
                  />
                </Field>
                <Field title="Account number">
                  <input
                    value={company.accountNumber}
                    onChange={(e) =>
                      setCompany({ ...company, accountNumber: e.target.value })
                    }
                  />
                </Field>
                <div className="span-two">
                  <Field title="Address">
                    <textarea
                      rows={2}
                      value={company.address}
                      onChange={(e) =>
                        setCompany({ ...company, address: e.target.value })
                      }
                    />
                  </Field>
                </div>
                <div className="span-two">
                  <Field title="Other payment instructions">
                    <textarea
                      rows={2}
                      value={company.paymentInstructions}
                      onChange={(e) =>
                        setCompany({
                          ...company,
                          paymentInstructions: e.target.value,
                        })
                      }
                    />
                  </Field>
                </div>
              </div>
            </section>
          )}

          <section className="form-card">
            <div className="card-heading">
              <div className="card-icon">
                <FileText size={19} />
              </div>
              <div>
                <h2>Invoice details</h2>
                <p>Invoice and payment information</p>
              </div>
            </div>
            <div className="form-grid">
              <div className="span-two">
                <Field title="Invoice title *">
                  <input
                    placeholder="e.g. Services rendered or Order #123"
                    value={invoice.projectName}
                    onChange={(e) => patch("projectName", e.target.value)}
                  />
                </Field>
              </div>
              <Field title="Invoice date">
                <input
                  type="date"
                  value={invoice.issueDate}
                  onChange={(e) => patch("issueDate", e.target.value)}
                />
              </Field>
              <Field title="Payment due">
                <input
                  type="date"
                  value={invoice.dueDate}
                  onChange={(e) => patch("dueDate", e.target.value)}
                />
              </Field>
              <Field title="Currency">
                <select
                  value={invoice.currency}
                  onChange={(e) =>
                    patch("currency", e.target.value as Invoice["currency"])
                  }
                >
                  <option value="NGN">NGN — Nigerian naira</option>
                  <option value="USD">USD — US dollar</option>
                  <option value="GBP">GBP — British pound</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              </Field>
              <Field title="Reference number">
                {guest ? (
                  <input
                    maxLength={40}
                    placeholder="INV-2026-001"
                    value={invoice.invoiceNo}
                    onChange={(e) => patch("invoiceNo", e.target.value)}
                  />
                ) : (
                  <input
                    readOnly
                    value={invoice.invoiceNo || "Assigned when saved"}
                    className="read-only"
                  />
                )}
              </Field>
            </div>
          </section>
          <section className="form-card">
            <div className="card-heading">
              <div className="card-icon">
                <Users size={19} />
              </div>
              <div>
                <h2>Bill to</h2>
                <p>Who will receive this invoice?</p>
              </div>
            </div>
            {!guest && (
              <div className="saved-client-row">
                <div className="select-grow">
                  <Field title="Load a saved client">
                    <select
                      value={
                        clients.some((c) => c.id === invoice.client.id)
                          ? invoice.client.id
                          : "custom"
                      }
                      onChange={(e) => {
                        const client = clients.find(
                          (c) => c.id === e.target.value,
                        );
                        if (client) patch("client", { ...client });
                      }}
                    >
                      <option value="custom">Enter client details</option>
                      {clients.map((c) => (
                        <option value={c.id} key={c.id}>
                          {c.name}
                          {c.company ? ` — ${c.company}` : ""}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <button className="btn btn-outline slim" onClick={onAddClient}>
                  <Plus size={16} /> New
                </button>
              </div>
            )}
            <div className="form-grid">
              <Field title="Contact name *">
                <input
                  placeholder="Full name"
                  value={invoice.client.name}
                  onChange={(e) =>
                    patch("client", { ...invoice.client, name: e.target.value })
                  }
                />
              </Field>
              <Field title="Company">
                <input
                  placeholder="Company name"
                  value={invoice.client.company}
                  onChange={(e) =>
                    patch("client", {
                      ...invoice.client,
                      company: e.target.value,
                    })
                  }
                />
              </Field>
              <Field title="Email address (needed to send by email)">
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={invoice.client.email}
                  onChange={(e) =>
                    patch("client", {
                      ...invoice.client,
                      email: e.target.value,
                    })
                  }
                />
              </Field>
              <Field title="Phone">
                <input
                  placeholder="+234 ..."
                  value={invoice.client.phone}
                  onChange={(e) =>
                    patch("client", {
                      ...invoice.client,
                      phone: e.target.value,
                    })
                  }
                />
              </Field>
              <div className="span-two">
                <Field title="Billing address">
                  <textarea
                    rows={2}
                    placeholder="Street, city and country"
                    value={invoice.client.address}
                    onChange={(e) =>
                      patch("client", {
                        ...invoice.client,
                        address: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>
            </div>
          </section>
          <section className="form-card">
            <div className="card-heading space-between">
              <div className="card-heading-inner">
                <div className="card-icon">
                  <CreditCard size={19} />
                </div>
                <div>
                  <h2>Line items</h2>
                  <p>Products, services and project costs</p>
                </div>
              </div>
              <span className="subtle-tag">
                {invoice.items.length} item{multiple ? "s" : ""}
              </span>
            </div>
            <div className="items-head">
              <span>ITEM DESCRIPTION</span>
              <span>QTY</span>
              <span>UNIT PRICE</span>
              <span>TOTAL</span>
              <span />
            </div>
            <div className="items-stack">
              {invoice.items.map((item, index) => (
                <div className="item-block" key={item.id}>
                  <div className="item-fields">
                    <div className="item-description">
                      <input
                        aria-label={`Item ${index + 1} description`}
                        placeholder="Service or item description"
                        value={item.description}
                        onChange={(e) =>
                          itemPatch(item.id, { description: e.target.value })
                        }
                      />
                      <input
                        className="secondary-input"
                        aria-label={`Item ${index + 1} details`}
                        placeholder="Additional detail (optional)"
                        value={item.detail}
                        onChange={(e) =>
                          itemPatch(item.id, { detail: e.target.value })
                        }
                      />
                    </div>
                    <input
                      aria-label="Quantity"
                      type="number"
                      min="0.01"
                      step="any"
                      value={item.quantity}
                      onChange={(e) =>
                        itemPatch(item.id, { quantity: Number(e.target.value) })
                      }
                    />
                    <input
                      aria-label="Unit price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        itemPatch(item.id, {
                          unitPrice: Number(e.target.value),
                        })
                      }
                    />
                    <div className="item-total">
                      {money(item.quantity * item.unitPrice, invoice.currency)}
                    </div>
                    <button
                      className="icon-button danger-hover"
                      aria-label="Remove line item"
                      disabled={invoice.items.length === 1}
                      onClick={() =>
                        patch(
                          "items",
                          invoice.items.filter((i) => i.id !== item.id),
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <label className="check-line">
                    <input
                      type="checkbox"
                      checked={item.upfrontExtra}
                      onChange={(e) =>
                        itemPatch(item.id, { upfrontExtra: e.target.checked })
                      }
                    />
                    <span>
                      Include this item in the initial payment
                    </span>
                  </label>
                </div>
              ))}
            </div>
            <button
              className="add-item"
              onClick={() => patch("items", [...invoice.items, newItem()])}
            >
              <Plus size={17} /> Add line item
            </button>
          </section>
          <section className="form-card">
            <div className="card-heading">
              <div className="card-icon">
                <Wallet size={19} />
              </div>
              <div>
                <h2>Payment schedule</h2>
                <p>Optional deposit, discounts and taxes</p>
              </div>
            </div>
            <div className="form-grid">
              <Field title="Deposit (%)">
                <div className="input-suffix">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={invoice.depositPercent}
                    onChange={(e) =>
                      patch("depositPercent", Number(e.target.value))
                    }
                  />
                  <span>%</span>
                </div>
              </Field>
              <Field title="Amount already paid" hint="Saved invoices: use Record payment for updates. Edit this field to correct a recorded total.">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={invoice.paidAmount}
                  onChange={(e) => patch("paidAmount", Number(e.target.value))}
                />
              </Field>
              <Field title="Discount (fixed amount)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={invoice.discount}
                  onChange={(e) => patch("discount", Number(e.target.value))}
                />
              </Field>
              <Field title="Tax rate">
                <div className="input-suffix">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={invoice.taxRate}
                    onChange={(e) => patch("taxRate", Number(e.target.value))}
                  />
                  <span>%</span>
                </div>
              </Field>
              <div className="span-two">
                <Field title="Payment terms">
                  <textarea
                    rows={2}
                    value={invoice.paymentTerms}
                    onChange={(e) => patch("paymentTerms", e.target.value)}
                  />
                </Field>
              </div>
            </div>
            <div className="help-text">
              <ShieldCheck size={16} /> Deposit applies to items not marked for full upfront payment.
              Discounts and taxes are included in the invoice total.
            </div>
          </section>
          <section className="form-card">
            <div className="card-heading">
              <div className="card-icon">
                <Pencil size={19} />
              </div>
              <div>
                <h2>Additional notes</h2>
                <p>Anything the client should know</p>
              </div>
            </div>
            <Field title="Notes shown on PDF">
              <textarea
                rows={4}
                placeholder="Add any terms or information relevant to this invoice."
                value={invoice.notes}
                onChange={(e) => patch("notes", e.target.value)}
              />
            </Field>
          </section>
        </div>
        <aside className="summary-column">
          <div className="summary-card">
            <div className="summary-top">
              <div>
                <div className="eyebrow">LIVE INVOICE SUMMARY</div>
                <h3>Payment breakdown</h3>
              </div>
              <div className="summary-seal">
                <FileText size={19} />
              </div>
            </div>
            <div className="summary-project">
              <span>INVOICE FOR</span>
              <strong>{invoice.projectName || "Untitled invoice"}</strong>
              <small>{invoice.client.name || "Enter a customer"}</small>
            </div>
            <div className="summary-rows">
              <div>
                <span>Subtotal</span>
                <strong>{money(totals.subtotal, invoice.currency)}</strong>
              </div>
              {totals.discount > 0 && (
                <div>
                  <span>Discount</span>
                  <strong>− {money(totals.discount, invoice.currency)}</strong>
                </div>
              )}
              {invoice.taxRate > 0 && (
                <div>
                  <span>Tax ({invoice.taxRate}%)</span>
                  <strong>{money(totals.tax, invoice.currency)}</strong>
                </div>
              )}
            </div>
            <div className="summary-total">
              <span>TOTAL INVOICE</span>
              <strong>{money(totals.total, invoice.currency)}</strong>
            </div>
            {(invoice.depositPercent > 0 || totals.extras > 0) && <div className="timeline">
              <div className="timeline-line" />
              <div className="timeline-stage">
                <span className="timeline-dot filled">
                  <Check size={13} />
                </span>
                <div>
                  <b>Initial payment</b>
                  <small>Deposit and advance charges (if any)</small>
                  <strong>{money(totals.upfront, invoice.currency)}</strong>
                </div>
              </div>
              <div className="timeline-stage">
                <span className="timeline-dot">
                  <Clock3 size={13} />
                </span>
                <div>
                  <b>Final payment</b>
                  <small>Remaining amount</small>
                  <strong>
                    {money(totals.finalPayment, invoice.currency)}
                  </strong>
                </div>
              </div>
            </div>}
            <div className="summary-bottom">
              <span>Already received</span>
              <b>{money(invoice.paidAmount, invoice.currency)}</b>
              <span>Outstanding balance</span>
              <strong>{money(totals.outstanding, invoice.currency)}</strong>
            </div>
            <div className="summary-info">
              <ShieldCheck size={17} />
              <span>
                Amounts update as you edit. Your invoice PDF includes the same
                breakdown.
              </span>
            </div>
          </div>
          <div className="summary-help">
            <Mail size={19} />
            <div>
              <b>{guest ? "Want to save your work?" : "Ready to share?"}</b>
              <p>
                {guest
                  ? "Create a free account to save invoices and reuse clients. Download your PDF to send it to anyone."
                  : "Save the invoice to send its PDF from your Gmail account, or download and share it manually."}
              </p>
            </div>
          </div>
        </aside>
      </div>
      <div className="editor-bottom">
        {!guest && (
          <button disabled={!!busy} className="btn btn-muted" onClick={onSave}>
            {busy === "save" ? <Spinner /> : <Check size={17} />} Save invoice
          </button>
        )}
        <button
          disabled={!!busy}
          className="btn btn-outline"
          onClick={onPreview}
        >
          {busy === "preview" ? <Spinner /> : <Eye size={17} />} Preview PDF
        </button>
        <button
          disabled={!!busy}
          className="btn btn-outline"
          onClick={onDownload}
        >
          {busy === "download" ? <Spinner /> : <ArrowDownToLine size={17} />}{" "}
          Download PDF
        </button>
      </div>
    </>
  );
}


function AppearanceControls({ company, setCompany }: { company: Company; setCompany: (c: Company) => void }) {
  function patch<K extends keyof Company>(key: K, value: Company[K]) { setCompany({ ...company, [key]: value }); }
  const templates = [
    { key: "classic", label: "Classic", subtitle: "Dark editorial header" },
    { key: "minimal", label: "Minimal", subtitle: "Light, spacious letterhead" },
    { key: "modern", label: "Modern", subtitle: "Full-color header" },
  ] as const;
  return <div className="appearance-options">
    <div className="appearance-templates" role="group" aria-label="Invoice layout preset">
      {templates.map(option => <button type="button" key={option.key} aria-pressed={(company.template || "classic") === option.key}
        className={`appearance-template ${(company.template || "classic") === option.key ? "selected" : ""}`}
        onClick={() => patch("template", option.key)}>
          <div className={`appearance-template-art ${option.key}`} style={{ "--accent-color": company.accent } as CSSProperties}>
            <i/><b/><span/><span/><em/>
          </div>
          <strong>{option.label}</strong><small>{option.subtitle}</small>
        </button>)}
    </div>
    <div className="appearance-field-grid">
      <Field title="Typography"><select value={company.fontStyle || "sans"} onChange={e => patch("fontStyle", e.target.value as Company["fontStyle"])}>
        <option value="sans">Contemporary sans</option><option value="serif">Editorial serif</option><option value="mono">Technical monospace</option>
      </select></Field>
      <Field title="Line spacing"><select value={company.density || "comfortable"} onChange={e => patch("density", e.target.value as Company["density"])}>
        <option value="comfortable">Comfortable</option><option value="compact">Compact</option>
      </select></Field>
      <Field title="Item table"><select value={company.tableStyle || "striped"} onChange={e => patch("tableStyle", e.target.value as Company["tableStyle"])}>
        <option value="striped">Alternating rows</option><option value="lined">Dividing lines</option><option value="plain">Plain white</option>
      </select></Field>
      <Field title="Custom accent color"><div className="appearance-color-field">
        <input aria-label="Pick invoice accent color" type="color" value={company.accent} onChange={e => patch("accent", e.target.value.toUpperCase())}/>
        <input aria-label="Accent color hex value" value={company.accent} maxLength={7} onChange={e => {
          const hex = e.target.value.trim(); if (/^#[0-9a-f]{6}$/i.test(hex)) patch("accent", hex.toUpperCase());
        }}/>
      </div></Field>
    </div>
    <div className="appearance-swatches" role="group" aria-label="Accent presets">
      {["#5359E8", "#147D70", "#242B3A", "#A64E84", "#C56B2A", "#191919"].map(c =>
        <button key={c} type="button" title={`Accent ${c}`} aria-label={`Accent ${c}`}
          className={company.accent.toLowerCase() === c.toLowerCase() ? "selected" : ""}
          style={{ backgroundColor: c }} onClick={() => patch("accent", c)}>{company.accent.toLowerCase() === c.toLowerCase() ? "✓" : ""}</button>)}
    </div>
    <p className="appearance-hint">Your layout, font, table style, spacing, and color are applied to PDF previews and downloads.</p>
  </div>;
}

function SettingsView({
  company,
  setCompany,
  busy,
  onSave,
}: {
  company: Company;
  setCompany: (c: Company) => void;
  busy: string;
  onSave: () => void;
}) {
  function patch<K extends keyof Company>(key: K, value: Company[K]) {
    setCompany({ ...company, [key]: value });
  }
  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">YOUR BRAND</div>
          <h1>
            Business settings<span className="title-dot">.</span>
          </h1>
          <p>These details appear on every invoice you create.</p>
        </div>
        <button className="btn btn-primary" onClick={onSave} disabled={!!busy}>
          {busy === "settings" ? <Spinner /> : <Check size={17} />} Save changes
        </button>
      </div>
      <div className="settings-layout">
        <div>
          <section className="form-card">
            <div className="card-heading">
              <div className="card-icon">
                <FileText size={19} />
              </div>
              <div>
                <h2>Business information</h2>
                <p>Sender details used across all PDFs</p>
              </div>
            </div>
            <div className="form-grid">
              <Field title="Business or sender name *">
                <input
                  value={company.businessName}
                  onChange={(e) => patch("businessName", e.target.value)}
                />
              </Field>
              <Field title="Contact person">
                <input
                  value={company.contactName}
                  onChange={(e) => patch("contactName", e.target.value)}
                />
              </Field>
              <Field title="Business email *">
                <input
                  type="email"
                  value={company.email}
                  onChange={(e) => patch("email", e.target.value)}
                />
              </Field>
              <Field title="Phone">
                <input
                  value={company.phone}
                  onChange={(e) => patch("phone", e.target.value)}
                />
              </Field>
              <div className="span-two">
                <Field title="Address">
                  <textarea
                    rows={3}
                    value={company.address}
                    onChange={(e) => patch("address", e.target.value)}
                  />
                </Field>
              </div>
              <div className="span-two">
                <Field title="Website">
                  <input
                    value={company.website}
                    onChange={(e) => patch("website", e.target.value)}
                    placeholder="https://..."
                  />
                </Field>
              </div>
            </div>
          </section>
          <section className="form-card">
            <div className="card-heading">
              <div className="card-icon">
                <Banknote size={19} />
              </div>
              <div>
                <h2>Payment information</h2>
                <p>Help clients know where to send money</p>
              </div>
            </div>
            <div className="form-grid">
              <Field title="Bank name">
                <input
                  value={company.bankName}
                  onChange={(e) => patch("bankName", e.target.value)}
                />
              </Field>
              <Field title="Account name">
                <input
                  value={company.accountName}
                  onChange={(e) => patch("accountName", e.target.value)}
                />
              </Field>
              <div className="span-two">
                <Field title="Account number">
                  <input
                    value={company.accountNumber}
                    onChange={(e) => patch("accountNumber", e.target.value)}
                  />
                </Field>
              </div>
              <div className="span-two">
                <Field title="Other payment instructions">
                  <textarea
                    rows={3}
                    value={company.paymentInstructions}
                    onChange={(e) =>
                      patch("paymentInstructions", e.target.value)
                    }
                    placeholder="Payment reference, transfer notes, alternatives..."
                  />
                </Field>
              </div>
            </div>
          </section>
        </div>
        <div>
          <section className="form-card">
            <div className="card-heading">
              <div className="card-icon">
                <Settings2 size={19} />
              </div>
              <div>
                <h2>Invoice appearance</h2>
                <p>Customize the layout and PDF styling</p>
              </div>
            </div>
            <AppearanceControls company={company} setCompany={setCompany}/>
            <Field title="Footer note">
              <textarea
                rows={3}
                value={company.footerNote}
                onChange={(e) => patch("footerNote", e.target.value)}
              />
            </Field>
          </section>
          <div className="side-info">
            <ShieldCheck size={19} />
            <b>One-time setup</b>
            <p>
              Set your business details once. Client information, invoices and payment
              records remain editable for future projects.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function InvoiceClient() {
  return (
    <div className="invoice-app">
      <InvoiceDashboard />
    </div>
  );
}
