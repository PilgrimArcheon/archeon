/** Offline tests: invoice payment transitions and receipt access controls. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const Module = require("node:module");
const root = path.resolve(__dirname, "..");
const id = "045bf9c3-553e-4037-a806-22dbc2056419";
const workspace = "11111111-1111-4111-8111-111111111111";
const calc = (i) => {
  const subtotal = i.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = Math.round((subtotal - i.discount + (subtotal - i.discount) * i.taxRate / 100) * 100) / 100;
  return { total, outstanding: Math.max(0, Math.round((total - i.paidAmount) * 100) / 100) };
};
const isPaid = i => calc(i).total > 0 && calc(i).outstanding === 0;
let lastSent = null;
let account = { workspaceId: workspace, email: "creator@example.com" };
let record = { id, invoiceNo: "INV-2026-0001", issueDate: "2026-10-14", dueDate: "2026-10-28", projectName: "Services provided", client: { name: "Customer", email: "client@example.com" }, currency: "USD", items: [{quantity: 1, unitPrice: 100}], discount: 0, taxRate: 0, paidAmount: 0, paidAt: "", status: "sent", sentAt: "" };
const reply = (data, status = 200) => ({ status, data });
const fail = (message, status = 400) => ({status, error: message});
const sql = async (parts, ...values) => {
  const statement = parts.join("??");
  if (statement.includes("INSERT INTO invoice_workspace_email_quota")) return [{attempts:1}];
  if (statement.includes("INSERT INTO invoice_workspace_email_log")) return [{id:123}];
  if (statement.includes("UPDATE invoice_workspace_email_log")) return [];
  if (statement.includes("UPDATE invoice_workspace_records")) {
    const update = JSON.parse(values[0]);
    if (values[1] !== id || values[2] !== workspace || JSON.stringify(record) !== values[3]) return [];
    record = update;
    return [{ data: {...record} }];
  }
  throw Error(`Unexpected SQL in test: ${statement.slice(0,80)}`);
};
const modules = {
  "@/features/auth/server": { currentAccount: async()=>account, validOrigin:()=>true },
  "@/features/invoice/models": { calculateInvoice:calc, isInvoicePaid:isPaid, receiptReference: () => "RCPT-2026-0001" },
  "@/features/invoice/server": {
    allowedOrigin:()=>true, badId:()=>false, database:()=>sql,
    fail, forbidden:()=>fail("origin",403), loadInvoice:async (rid,wid) => rid===id && wid===workspace ? structuredClone(record) : null,
    loadCompany:async ()=>({businessName:"Studio",accent:"#5359E8",fontStyle:"sans"}),
    ok:reply, unauthorized:()=>fail("login",401), unexpected:(e)=>{throw e}
  },
  "@/features/invoice/receipt": { createReceiptPDF: async ()=>Uint8Array.from([37,80,68,70]) },
  "@/features/invoice/gmail": {
    GmailError: class GmailError extends Error {},
    gmailSend: async (_wid, options) => { lastSent = options; return "test-gmail-message-id"; },
  },
};
function load(file) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }}).outputText;
  const module = { exports: {} };
  const run = new Function("require", "module", "exports", code);
  run((name) => {
    if (Object.hasOwn(modules, name)) return modules[name];
    if (name === "@/features/invoice/pdf") return { createInvoicePDF: async()=>new Uint8Array() };
    return require(name);
  }, module, module.exports);
  return module.exports;
}
const track = load("src/app/api/apps/invoice/invoices/[id]/tracking/route.ts");
const receipt = load("src/app/api/apps/invoice/invoices/[id]/receipt/route.ts");
const send = load("src/app/api/apps/invoice/invoices/[id]/send/route.ts");
const params = { params:Promise.resolve({ id }) };
const post = (action, amount) => track.POST({json:async()=>({action,amount})},params);
async function run() {
  const blocked = await receipt.GET({}, params);
  assert.equal(blocked.status, 409, "a partial/unpaid invoice cannot have a receipt");
  let result = await post("record_payment",40);
  assert.equal(result.status,200); assert.equal(record.paidAmount,40); assert.equal(record.paidAt,"");
  assert.equal((await receipt.GET({},params)).status,409);
  result = await post("record_payment",60);
  assert.equal(result.status,200); assert.equal(record.paidAmount,100); assert.ok(Date.parse(record.paidAt));
  const completedAt = record.paidAt;
  const reply = await send.POST({json:async()=>({subject:"Payment receipt", message:"Thank you", documentType:"receipt"})},params);
  assert.equal(reply.status,200,"paid receipt must be emailable");
  assert.equal(lastSent.filename,"RCPT-2026-0001.pdf","receipt PDF file name is distinct from invoice");
  assert.equal(record.status,"sent","sending a receipt must not change invoice records");
  assert.equal((await receipt.GET({},params)).status,200,"completed invoice should have a receipt");
  result=await post("mark_paid"); assert.equal(result.status,200); assert.equal(record.paidAt,completedAt,"paid date must remain stable");
  account = null;
  assert.equal((await receipt.GET({},params)).status,401,"anonymous users cannot download stored receipts");
  account = { workspaceId: "22222222-2222-4222-8222-222222222222", email:"other@example.com" };
  assert.equal((await receipt.GET({},params)).status,404,"other workspaces cannot download receipts");
  account = {workspaceId:workspace,email:"creator@example.com"};
  record = {...record, paidAmount:0, paidAt:""};
  const unsent = await send.POST({json:async()=>({subject:"Receipt",message:"Test",documentType:"receipt"})},params);
  assert.equal(unsent.status,409,"cannot email a receipt before full payment");
  result=await post("mark_paid");assert.equal(result.status,200);assert.equal(record.paidAmount,100);assert.ok(record.paidAt);
  console.log("PASS: full and partial payments, stable completion dates, gated receipt PDF, Gmail attachment and workspace isolation");
}
run().catch(err=>{console.error(err);process.exitCode=1});
