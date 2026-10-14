import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { type Company, type Invoice, calculateInvoice, invoiceReference, isInvoicePaid, receiptReference } from "./models";

const white = rgb(1, 1, 1);
const ink = rgb(.085, .095, .12);
const muted = rgb(.43, .46, .52);
const soft = rgb(.958, .963, .97);
const line = rgb(.88, .89, .91);
const safe = (value: string | number = "") => String(value).replace(/₦/g, "NGN ")
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-")
  .normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E\n]/g, "?");
const moneyText = (value: number, currency: Invoice["currency"]) =>
  `${currency} ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const showDate = (value: string) => new Date(value).toLocaleDateString("en-GB", {
  day: "2-digit", month: "long", year: "numeric", timeZone: "UTC",
});
function color(hex: string) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return rgb(.32, .35, .91);
  const n = parseInt(hex.slice(1), 16);
  return rgb((n >> 16) / 255, (n >> 8 & 255) / 255, (n & 255) / 255);
}

/** Only call with a fully paid invoice, and still enforce it here as defense in depth. */
export async function createReceiptPDF(invoice: Invoice, company: Company): Promise<Uint8Array> {
  if (!isInvoicePaid(invoice)) throw new Error("A receipt can only be issued for a fully paid invoice.");
  const summary = calculateInvoice(invoice);
  const pdf = await PDFDocument.create();
  const receiptNo = receiptReference(invoice);
  pdf.setTitle(`Payment Receipt ${receiptNo}`);
  pdf.setSubject(`Receipt for invoice ${invoiceReference(invoice)}`);
  pdf.setAuthor(company.businessName || "Invoice issuer");
  const face = company.fontStyle === "serif" ? [StandardFonts.TimesRoman, StandardFonts.TimesRomanBold]
    : company.fontStyle === "mono" ? [StandardFonts.Courier, StandardFonts.CourierBold]
    : [StandardFonts.Helvetica, StandardFonts.HelveticaBold];
  const font = await pdf.embedFont(face[0]);
  const bold = await pdf.embedFont(face[1]);
  const page = pdf.addPage([595.28, 841.89]);
  const W = 595.28, H = 841.89, M = 44, R = W - M;
  const accent = color(company.accent || "#5359E8");
  const lightAccent = (() => {
    const v = (company.accent || "#5359E8").replace("#", "");
    const [r,g,b] = [0,2,4].map(i => parseInt(v.slice(i,i+2),16)/255);
    return .2126*r + .7152*g + .0722*b > .62;
  })();
  const contrast = lightAccent ? ink : white;
  const template = company.template || "classic";

  function text(s: string, x: number, top: number, size = 10, options: {face?: PDFFont; shade?: ReturnType<typeof rgb>; right?: boolean} = {}) {
    const text = safe(s).replace(/\n/g, " ") || " ";
    const face = options.face || font;
    const px = options.right ? x - face.widthOfTextAtSize(text, size) : x;
    page.drawText(text, { x: px, y: H - top - size, size, font: face, color: options.shade || ink });
  }
  function wrap(value: string, width: number, size = 10, face = font) {
    const lines: string[] = [];
    for (const paragraph of safe(value).split("\n")) {
      let current = "";
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        let part = word;
        while (part.length && face.widthOfTextAtSize(part, size) > width) {
          let n = 1;
          while (n < part.length && face.widthOfTextAtSize(part.slice(0, n+1), size) <= width) n++;
          if (current) { lines.push(current); current = ""; }
          lines.push(part.slice(0, n)); part = part.slice(n);
        }
        if (!part) continue;
        const attempt = current ? `${current} ${part}` : part;
        if (face.widthOfTextAtSize(attempt, size) > width && current) { lines.push(current); current = part; }
        else current = attempt;
      }
      lines.push(current);
    }
    return lines;
  }
  function paragraph(value: string, x: number, top: number, width: number, size = 9.5, lh = 15, shade = ink, face = font) {
    let at = top;
    for (const part of wrap(value, width, size, face)) {
      if (part) text(part, x, at, size, { shade, face });
      at += lh;
    }
    return at;
  }
  function divider(top: number) { page.drawLine({ start: { x: M, y: H-top }, end: { x: R, y: H-top }, color: line, thickness: .8 }); }

  if (template === "classic") {
    page.drawRectangle({ x: 0, y: H - 175, width: W, height: 175, color: rgb(.055, .065, .095) });
    text((company.businessName || "ISSUER").toUpperCase(), M, 30, 11, { face: bold, shade: rgb(.81, .84, .9) });
    text("PAYMENT RECEIPT", M, 70, 29, { face: bold, shade: white });
    text(receiptNo, M, 120, 13, { face: bold, shade: rgb(.81, .84, .9) });
  } else if (template === "modern") {
    page.drawRectangle({ x: 0, y: H - 175, width: W, height: 175, color: accent });
    text((company.businessName || "ISSUER").toUpperCase(), M, 30, 11, { face: bold, shade: contrast });
    text("PAYMENT RECEIPT", M, 70, 29, { face: bold, shade: contrast });
    text(receiptNo, M, 120, 13, { face: bold, shade: contrast });
  } else {
    text((company.businessName || "ISSUER").toUpperCase(), M, 35, 11, { face: bold, shade: accent });
    text("PAYMENT RECEIPT", M, 77, 29, { face: bold });
    text(receiptNo, M, 132, 13, { shade: muted });
    page.drawRectangle({ x: M, y: H - 173, width: R-M, height: 3, color: accent });
  }

  let y = 202;
  text("RECEIVED FROM", M, y, 8.5, { face: bold, shade: accent });
  text("ISSUED BY", M + 263, y, 8.5, { face: bold, shade: accent });
  const client = [invoice.client.name, invoice.client.company !== invoice.client.name ? invoice.client.company : "",
    invoice.client.email, invoice.client.address].filter(Boolean).join("\n");
  const issuer = [company.businessName, company.contactName, company.email, company.address].filter(Boolean).join("\n");
  const leftEnd = paragraph(client, M, y + 21, 233, 9.2, 15);
  const rightEnd = paragraph(issuer, M + 263, y + 21, 234, 9.2, 15);
  y = Math.max(leftEnd, rightEnd, y + 103) + 22;
  divider(y); y += 25;

  text("PAYMENT FOR", M, y, 8.5, { face: bold, shade: accent });
  y = paragraph(invoice.projectName, M, y + 20, R-M, 13, 19, ink, bold) + 29;

  // A receipt acknowledges the amount received, not a new amount due.
  page.drawRectangle({ x: M, y: H - y - 120, width: R-M, height: 120, color: soft });
  page.drawRectangle({ x: M, y: H - y - 120, width: 4, height: 120, color: accent });
  text("PAYMENT RECEIVED IN FULL", M + 18, y + 18, 9, { face: bold, shade: muted });
  text(moneyText(summary.total, invoice.currency), M + 18, y + 42, 25, { face: bold, shade: accent });
  text("BALANCE REMAINING", M + 18, y + 89, 8.5, { face: bold, shade: muted });
  text(moneyText(0, invoice.currency), R - 18, y + 87, 12, { face: bold, right: true });
  y += 151;

  const fields: [string, string][] = [
    ["Original invoice", invoiceReference(invoice)],
    ["Invoice issued", showDate(`${invoice.issueDate}T12:00:00Z`)],
    ["Invoice total", moneyText(summary.total, invoice.currency)],
    ["Total payment recorded", moneyText(invoice.paidAmount, invoice.currency)],
    ["Payment completed", invoice.paidAt ? showDate(invoice.paidAt) : "Date not available for this invoice"],
  ];
  for (const [label, value] of fields) {
    text(label, M + 2, y, 9.2, { shade: muted });
    text(value, R - 2, y, value.length > 39 ? 8.1 : 10, { face: bold, right: true });
    y += 34;
    divider(y - 5);
  }

  const footerY = Math.max(y + 22, 711);
  // Use neutral disclosure: entries are manually recorded, not bank verified.
  paragraph("Full payment has been recorded by the invoice issuer. This receipt is not independent confirmation from a bank or payment processor.",
    M, footerY, R-M, 8.5, 13, muted);
  page.drawLine({ start: { x: M, y: 49 }, end: { x: R, y: 49 }, color: line, thickness: .8 });
  const footer = company.footerNote || "Thank you for your business.";
  paragraph(footer, M, H - 39, R-M-45, 8, 10, muted);
  return pdf.save();
}
