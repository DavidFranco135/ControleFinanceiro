import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = req.body;

    console.log("Webhook recebido:", JSON.stringify(data, null, 2));

    // Tenta pegar email em vários formatos possíveis
    const email =
      data?.Customer?.email ||
      data?.customer?.email ||
      data?.buyer?.email ||
      data?.order?.customer?.email ||
      null;

    if (!email) {
      console.log("Webhook recebido, mas sem email:", data);
      return res.status(400).json({ error: "Email não encontrado no webhook" });
    }

    // Converte email para o mesmo padrão do app (safeId)
    const safeId = email.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");

    const db = admin.firestore();
    const userRef = db.collection("users").doc(safeId);

    const orderStatus = data?.order_status || data?.status || null;
    const eventType = data?.webhook_event_type || null;

    // 👉 PAGAMENTO APROVADO
    if (orderStatus === "paid" || eventType === "order_approved") {
      await userRef.set(
        {
          status: "paid",
          paidAt: new Date().toISOString(),
        },
        { merge: true }
      );

      console.log("Acesso LIBERADO para:", email);
    }

    // 👉 REEMBOLSO
    if (orderStatus === "refunded" || eventType === "order_refunded") {
      await userRef.set(
        {
          status: "pending",
          refundedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      console.log("Acesso BLOQUEADO (reembolso) para:", email);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erro webhook:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
