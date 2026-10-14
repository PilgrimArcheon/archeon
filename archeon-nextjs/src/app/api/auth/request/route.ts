import { json } from "@/features/auth/server";
export const runtime = "nodejs";
export async function POST() { return json({ error: "Magic links are no longer used. Sign in with your email and password at /app/auth/sign-in." }, 410); }
