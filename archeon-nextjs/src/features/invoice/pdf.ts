import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { type Company, type Invoice, calculateInvoice, invoiceReference } from "./models";

// Standard PDF fonts cannot display every Unicode glyph. Render Naira amounts as NGN
// and normalize freeform text so a customer's name can never break PDF generation.
const safe = (s: string | number = "") => String(s).replace(/₦/g, "NGN ").replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"').replace(/[–—]/g, "-").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^\x20-\x7E\n]/g, "?");
const ink = rgb(0.105, 0.13, 0.21);
const muted = rgb(0.43, 0.48, 0.58);
const border = rgb(0.89, 0.91, 0.94);
const pale = rgb(0.96, 0.967, 0.976);
const white = rgb(1, 1, 1);
const hex = (v: string) => {
  const m = /^#([0-9a-fA-F]{6})$/.exec(v);
  if (!m) return rgb(.32, .35, .91);
  const n = parseInt(m[1], 16);
  return rgb((n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};
function price(n: number, c: Invoice["currency"]) {
  return `${c} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function date(d: string) {
  return new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
}

export async function createInvoicePDF(invoice: Invoice, company: Company): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const reference = invoiceReference(invoice);
  pdf.setTitle(`${reference} - ${invoice.projectName}`);
  pdf.setAuthor(company.businessName);
  pdf.setSubject("Invoice");
  const type = company.fontStyle || "sans";
  const fonts = type === "serif" ? [StandardFonts.TimesRoman, StandardFonts.TimesRomanBold]
    : type === "mono" ? [StandardFonts.Courier, StandardFonts.CourierBold]
    : [StandardFonts.Helvetica, StandardFonts.HelveticaBold];
  const regular = await pdf.embedFont(fonts[0]);
  const bold = await pdf.embedFont(fonts[1]);
  const layout = company.template || "classic";
  const compact = company.density === "compact";
  const tableStyle = company.tableStyle || "striped";
  const W = 595.28, H = 841.89, M = 42, INNER = W - M * 2;
  const accent = hex(company.accent);
  const accentIsLight = (() => { const [r,g,b] = [1,3,5].map(i=>parseInt(company.accent.slice(i,i+2),16)/255);
    return (0.2126*r + 0.7152*g + 0.0722*b) > 0.62; })();
  const accentInk = accentIsLight ? ink : white;
  const totals = calculateInvoice(invoice);
  let page: PDFPage;
  let y = 0;

  function draw(s: string, x: number, top: number, options: {font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; align?: "right"} = {}) {
    const font = options.font ?? regular, size = options.size ?? 10;
    const value = safe(s).replace(/\n/g, " ");
    const dx = options.align === "right" ? x - font.widthOfTextAtSize(value, size) : x;
    page.drawText(value || " ", { x: dx, y: H - top - size, font, size, color: options.color ?? ink });
  }
  function rule(top: number, color = border) { page.drawLine({ start: { x: M, y: H - top }, end: { x: W-M, y: H - top }, thickness: .8, color }); }
  function lines(s: string, width: number, size: number, font: PDFFont): string[] {
    const result: string[] = [];
    for (const paragraph of safe(s).split("\n")) {
      let current = "";
      for (const word of paragraph.split(/\s+/)) {
        if (!word) continue;
        const test = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(test, size) <= width) { current = test; continue; }
        if (current) result.push(current);
        current = "";
        for (const char of word) {
          if (font.widthOfTextAtSize(current + char, size) > width && current) {
            result.push(current); current = char;
          } else current += char;
        }
      }
      result.push(current);
    }
    return result;
  }
  function paragraph(s: string, x: number, top: number, width: number, size = 9.5, lh = 15, font = regular, color = muted) {
    let at = top;
    for (const line of lines(s, width, size, font)) {
      if (line.trim()) draw(line, x, at, { font, size, color });
      at += lh;
    }
    return at;
  }
  function startPage(first = false) {
    page = pdf.addPage([W, H]);
    if (first) {
      if (layout === "classic") {
        page.drawRectangle({ x: 0, y: H - 170, width: W, height: 170, color: rgb(.055, .065, .095) });
        for (let k = 0; k < 9; k++) {
          const xx = 320 + k * 48;
          page.drawLine({ start: { x: xx, y: H - 169 }, end: { x: xx + 170, y: H }, thickness: 26, color: rgb(.11, .12, .15), opacity: .68 });
        }
        draw(company.businessName.toUpperCase(), M, 27, { font: bold, size: 11, color: rgb(.82, .85, .94) });
        draw("INVOICE", M, 66, { font: bold, size: 34, color: white });
        draw(reference, M, 115, { font: bold, size: 15, color: rgb(.75, .78, .89) });
        y = 195;
      } else if (layout === "modern") {
        page.drawRectangle({ x: 0, y: H - 159, width: W, height: 159, color: accent });
        draw(company.businessName.toUpperCase(), M, 27, { font: bold, size: 11, color: accentInk });
        draw("INVOICE", M, 62, { font: bold, size: 37, color: accentInk });
        draw(reference, M, 112, { font: bold, size: 12, color: accentInk });
        y = 190;
      } else {
        draw(company.businessName.toUpperCase(), M, 36, { font: bold, size: 11, color: accent });
        draw("INVOICE", M, 72, { font: bold, size: 39, color: ink });
        draw(reference, M, 125, { font: regular, size: 12, color: muted });
        page.drawRectangle({ x: M, y: H - 159, width: INNER, height: 3, color: accent });
        y = 190;
      }
    } else {
      draw(`${company.businessName} / ${reference}`, M, 31, { font: bold, size: 11 });
      rule(56); y = 80;
    }
  }
  function ensure(height: number) { if (y + height > H - 68) startPage(); }
  startPage(true);

  // Three-column sender/recipient/date section.
  draw("FROM", M, y, { font: bold, size: 8.5, color: accent });
  draw("BILL TO", M + 184, y, { font: bold, size: 8.5, color: accent });
  draw("INVOICE DATE", M + 373, y, { font: bold, size: 8.5, color: accent });
  const cFrom = [company.businessName, company.contactName, company.email, company.phone, company.address].filter(Boolean).join("\n");
  const cTo = [invoice.client.name, invoice.client.company !== invoice.client.name ? invoice.client.company : "", invoice.client.email, invoice.client.phone, invoice.client.address].filter(Boolean).join("\n");
  const fy = paragraph(cFrom, M, y + 21, 163, 9.4, 14);
  const ty = paragraph(cTo, M + 184, y + 21, 167, 9.4, 14);
  draw(date(invoice.issueDate), M + 373, y + 20, { size: 9 });
  draw("DUE DATE", M + 373, y + 53, { font: bold, size: 8.5, color: accent });
  draw(date(invoice.dueDate), M + 373, y + 74, { size: 9 });
  y = Math.max(fy, ty, y + 110) + 27;
  rule(y); y += 19;

  draw("INVOICE FOR", M, y, { font: bold, size: 8.5, color: accent });
  y = paragraph(invoice.projectName, M, y + 17, INNER, 15, 21, bold, ink) + 19;

  // Table, with automatic page breaks for many invoice items.
  function tableHeader() {
    page.drawRectangle({ x: M, y: H - y - 31, width: INNER, height: 31, color: layout === "modern" ? accent : rgb(.92, .93, .96) });
    draw("DESCRIPTION", M + 14, y + 9, { font: bold, size: 8, color: layout === "modern" ? accentInk : muted });
    draw("QTY", M + 321, y + 9, { font: bold, size: 8, color: layout === "modern" ? accentInk : muted, align: "right" });
    draw("RATE", M + 412, y + 9, { font: bold, size: 8, color: layout === "modern" ? accentInk : muted, align: "right" });
    draw("AMOUNT", W - M - 14, y + 9, { font: bold, size: 8, color: layout === "modern" ? accentInk : muted, align: "right" });
    y += 31;
  }
  tableHeader();
  for (let n = 0; n < invoice.items.length; n++) {
    const item = invoice.items[n];
    const textLines = lines(item.description, 260, 9.5, bold);
    const detailLines = item.detail ? lines(item.detail, 260, 8.4, regular) : [];
    const rowH = Math.max(compact ? 32 : 43, (compact ? 7 : 14) + textLines.length * 13 + detailLines.length * 12 + (item.upfrontExtra ? 13 : 0));
    if (y + rowH > H - 70) { startPage(); tableHeader(); }
    if (tableStyle === "striped" && n % 2 === 0) page.drawRectangle({ x: M, y: H - y - rowH, width: INNER, height: rowH, color: pale });
    if (tableStyle === "lined") page.drawLine({ start: { x: M, y: H-y-rowH }, end: { x: W-M, y: H-y-rowH }, thickness: .65, color: border });
    let at = y + (compact ? 6 : 10);
    for (const t of textLines) { draw(t, M + 14, at, { font: bold, size: 9.5 }); at += 13; }
    for (const t of detailLines) { draw(t, M + 14, at + 1, { size: 8.4, color: muted }); at += 12; }
    if (item.upfrontExtra) draw("PAYABLE UPFRONT", M + 14, at + 1, { font: bold, size: 7.3, color: accent });
    draw(item.quantity.toLocaleString("en-US"), M + 321, y + 14, { size: 9, align: "right" });
    draw(price(item.unitPrice, invoice.currency), M + 412, y + 14, { size: 8.5, align: "right" });
    draw(price(item.quantity * item.unitPrice, invoice.currency), W - M - 14, y + 14, { font: bold, size: 8.6, align: "right" });
    y += rowH;
  }

  // Right aligned totals; allocate room ahead of time to avoid clipped totals.
  ensure(207); y += 16;
  const TX = M + 293, RIGHT = W - M - 12;
  function tally(label: string, value: string, strong = false, color = ink) {
    draw(label, TX, y, { size: 9, font: strong ? bold : regular, color });
    draw(value, RIGHT, y, { size: strong ? 11 : 9, font: strong ? bold : regular, color, align: "right" });
    y += strong ? 29 : 24;
  }
  tally("Subtotal", price(totals.subtotal, invoice.currency));
  if (totals.discount) tally("Discount", `- ${price(totals.discount, invoice.currency)}`);
  if (invoice.taxRate) tally(`Tax (${invoice.taxRate}%)`, price(totals.tax, invoice.currency));
  page.drawRectangle({ x: TX - 12, y: H - y - 41, width: RIGHT - TX + 26, height: 41, color: layout === "modern" ? rgb(.95,.95,.95) : rgb(.92, .93, .98) });
  draw("INVOICE TOTAL", TX, y + 12, { font: bold, size: 10 });
  draw(price(totals.total, invoice.currency), RIGHT, y + 10, { font: bold, size: 13, color: accent, align: "right" });
  y += 55;
  if (invoice.depositPercent > 0 || totals.extras > 0) {
    tally("Initial payment", price(totals.upfront, invoice.currency));
    tally("Remaining payment", price(totals.finalPayment, invoice.currency));
  }
  if (invoice.paidAmount > 0) tally("Amount received", price(invoice.paidAmount, invoice.currency));
  rule(y + 3); y += 15;
  tally("BALANCE OUTSTANDING", price(totals.outstanding, invoice.currency), true, accent);
  y += 10;

  if (invoice.notes.trim()) {
    ensure(75); draw("ADDITIONAL NOTES", M, y, { font: bold, size: 9, color: accent }); y += 18;
    const notesLines = lines(invoice.notes, INNER, 9.2, regular);
    for (const l of notesLines) { ensure(15); draw(l, M, y, { size: 9.2, color: muted }); y += 14; }
    y += 19;
  }
  if (invoice.paymentTerms.trim()) {
    ensure(50); draw("PAYMENT TERMS", M, y, { font: bold, size: 9, color: accent }); y += 18;
    for (const l of lines(invoice.paymentTerms, INNER, 9.2, regular)) { ensure(15); draw(l, M, y, { size: 9.2, color: muted }); y += 14; }
    y += 19;
  }
  const bank = [company.bankName, company.accountName, company.accountNumber].filter(Boolean).join(" | ");
  const pay = [bank, company.paymentInstructions].filter(Boolean).join("\n");
  if (pay) {
    ensure(55); draw("PAYMENT DETAILS", M, y, { font: bold, size: 9, color: accent }); y += 18;
    for (const l of lines(pay, INNER, 9.3, regular)) { ensure(15); draw(l, M, y, { size: 9.3, color: ink }); y += 15; }
  }

  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    page = p;
    p.drawLine({ start: { x: M, y: 48 }, end: { x: W - M, y: 48 }, thickness: .8, color: border });
    draw(company.footerNote || "Thank you for your business.", M, H - 41, { color: muted, size: 8 });
    draw(`${i + 1} / ${pages.length}`, W - M, H - 41, { color: muted, size: 8, align: "right" });
  });
  return pdf.save();
}
