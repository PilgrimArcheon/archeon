import { NextRequest } from "next/server";
import { POST as submitFeedback } from "@/app/api/feedback/route";
import { json, validOrigin } from "@/features/auth/server";
/** Compatibility endpoint: old portfolio clients also write to the private inbox. */
export const runtime="nodejs";
export async function POST(request: NextRequest) {
  if (!validOrigin(request)) return json({error:"Origin not allowed"},403);
  let data: Record<string,unknown>;
  try {const payload:unknown=await request.json();if(!payload||typeof payload!=="object"||Array.isArray(payload))throw Error();data=payload as Record<string,unknown>;}catch{return json({error:"Invalid request"},400);}
  const name=typeof data.name==="string"?data.name.trim().slice(0,100):"";
  const email=typeof data.email==="string"?data.email.trim():"";
  const message=typeof data.message==="string"?data.message.trim():"";
  if(!name)return json({error:"Please enter your name"},400);
  const headers=new Headers({"content-type":"application/json","origin":new URL(request.url).origin});
  const ip=request.headers.get("x-vercel-forwarded-for")||request.headers.get("x-forwarded-for");
  if(ip)headers.set("x-forwarded-for",ip);
  const forwarded=new NextRequest(new URL("/api/feedback",request.url),{method:"POST",headers,body:JSON.stringify({category:"question",source:"portfolio",subject:`Portfolio enquiry from ${name}`,email,message,website:data.company})});
  return submitFeedback(forwarded);
}
