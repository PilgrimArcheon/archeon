import { json } from "@/features/auth/server";
export const runtime = "nodejs";
export async function POST() { return json({ error: "Magic-link sign-in is disabled. Use /app/auth/sign-in." }, 410); }
