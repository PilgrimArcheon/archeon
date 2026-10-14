import { NextRequest } from "next/server";
import { currentAccount } from "@/features/auth/server";
import { companySchema } from "@/features/invoice/models";
import { allowedOrigin, fail, forbidden, ok, saveCompany, unauthorized, unexpected } from "@/features/invoice/server";
export const runtime = "nodejs";
export async function PUT(req: NextRequest) {
  if (!allowedOrigin(req)) return forbidden();
  try {
    const account = await currentAccount();
    if (!account) return unauthorized();
    const parsed = companySchema.safeParse(await req.json());
    if (!parsed.success) return fail("Please check your business details.");
    await saveCompany(account.workspaceId, parsed.data);
    return ok(parsed.data);
  } catch (err) { return unexpected(err); }
}
