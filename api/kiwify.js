import { NextResponse } from "next/server";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function POST(request) {
  try {
    // ✅ valida token do webhook
    const token = process.env.KIWIFY_TOKEN;
    const receivedToken = request.headers.get("x-kiwify-token");

    console.log("🔔 Webhook Kiwify chegou!");
    console.log("📌 receivedToken:", receivedToken);

    if (!token) {
      console.log("❌ KIWIFY_TOKEN não configurado");
      return NextResponse.json({ error: "Token não configurado" }, { status: 500 });
    }

    if (receivedToken !== token) {
      console.log("❌ Token inválido");
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // ✅ pega o body
    const data = await request.json();
    console.log("📌 Payload:", data);

    const event = data?.order?.webhook_event_type;
    const status = data?.order?.order_status;
    const email = data?.order?.Customer?.email;

    console.log("📌 event:", event);
    console.log("📌 status:", status);
    console.log("📌 email:", email);

    if (!email) {
      return NextResponse.json({ error: "Email não encontrado" }, { status: 400 });
    }

    // ✅ libera quando aprovado/pago
    if (event === "order_approved" && status === "paid") {
      const db = admin.firestore();

      await db.collection("usersByEmail").doc(email).set(
        {
          paid: true,
          plan: "premium",
          orderId: data?.order?.order_id,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log("✅ Acesso liberado no Firestore para:", email);
      return NextResponse.json({ ok: true, released: true }, { status: 200 });
    }

    return NextResponse.json({ ok: true, released: false }, { status: 200 });
  } catch (err) {
    console.error("❌ Erro no webhook:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Webhook online" }, { status: 200 });
}
