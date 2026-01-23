import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const data = req.body;

    console.log("Webhook recebido:", JSON.stringify(data, null, 2));

    const email =
      data?.order?.Customer?.email ||
      data?.order?.customer?.email ||
      data?.Customer?.email ||
      data?.customer?.email ||
      null;

    if (!email) {
      console.log("Webhook sem email:", data);
      return res.status(400).json({ error: "Email não encontrado no webhook" });
    }

    const safeId = email.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");

    // 👉 AQUI ESTÁ O CAMPO CERTO
    const kiwifyStatus = data?.order?.order_status || "";

    let status = "pending";

    if (
      kiwifyStatus === "paid" ||
      kiwifyStatus === "approved" ||
      kiwifyStatus === "order_approved"
    ) {
      status = "paid";
    }

    if (
      kiwifyStatus === "refunded" ||
      kiwifyStatus === "refund_requested" ||
      kiwifyStatus === "chargeback" ||
      kiwifyStatus === "order_refunded"
    ) {
      status = "pending";
    }

    const db = admin.firestore();

    await db.collection("users").doc(safeId).set(
      {
        email,
        status,
        paid: status === "paid",
        pending: status !== "paid",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log(
      "Status atualizado:",
      email,
      "=> kiwify:",
      kiwifyStatus,
      "=> app:",
      status
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erro no webhook:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
