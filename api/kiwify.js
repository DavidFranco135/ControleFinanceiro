import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, message: "Kiwify API OK" }, { status: 200 });
}

export async function POST(request) {
  const body = await request.text();
  console.log("Webhook recebido:", body);
  return NextResponse.json({ ok: true }, { status: 200 });
}
