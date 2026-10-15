import { NextRequest } from "next/server";
import { adminAccount } from "@/features/admin/access";
import { database, json, validOrigin } from "@/features/auth/server";
export const runtime = "nodejs";
export async function PATCH(req: NextRequest, { params }: {params: Promise<{id:string}>}) {
  if (!validOrigin(req)) return json({error:"Forbidden"},403);
  const admin = await adminAccount().catch(() => null);
  if (!admin) return json({error:"Forbidden"},403);
  const {id} = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({error:"Invalid entry"},400);
  const body: unknown = await req.json().catch(() => null);
  const status = body && typeof body === "object" && "status" in body ? (body as {status?:unknown}).status : null;
  if (status !== "new" && status !== "reviewing" && status !== "resolved") return json({error:"Invalid status"},400);
  try {
    const sql = database();
    const result = await sql`UPDATE archeon_feedback SET status=${status}, updated_at=NOW() WHERE id=${id} RETURNING id`;
    return result.length ? json({success:true}) : json({error:"Not found"},404);
  } catch(err) {console.error("Feedback status update failed",err);return json({error:"Unable to update feedback"},503);}
}

export async function DELETE(req: NextRequest, { params }: {params: Promise<{id:string}>}) {
 if (!validOrigin(req)) return json({error:"Forbidden"},403);
 const admin = await adminAccount().catch(() => null);
 if (!admin) return json({error:"Forbidden"},403);
 const {id}=await params;
 if (!/^[0-9a-f-]{36}$/i.test(id)) return json({error:"Invalid entry"},400);
 try {const sql=database();await sql`DELETE FROM archeon_feedback WHERE id=${id}`;return json({success:true});}
 catch(err) {console.error("Feedback deletion failed",err);return json({error:"Unable to delete feedback"},503);}
}
