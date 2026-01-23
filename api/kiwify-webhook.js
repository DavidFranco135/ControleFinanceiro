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
    const data = req.body?.order || req.body;

    console.log("Webhook recebido:", JSON.stringify(data, null, 2));

    const email =
      data?.Customer?.email ||
      data?.customer?.email ||
      data?.buyer?.email ||
      data?.order?.Customer?.email ||
      null;

    if (!email) {
      console.log("Webhook sem email:", data);
      return res.status(400).json({ error: "Email não encontrado no webhook" });
    }

    const orderStatus = data.order_status;
    let appStatus = "pending";

    if (orderStatus === "paid" || orderStatus === "approved") {
      appStatus = "paid";
    }

    if (
      orderStatus === "refunded" ||
      orderStatus === "refund_requested" ||
      orderStatus === "chargeback"
    ) {
      appStatus = "blocked";
    }

    const db = admin.firestore();

    await db.collection("users").doc(email.toLowerCase()).set(
      {
        status: appStatus,
        paid: appStatus === "paid",
        pending: appStatus !== "paid",
        lastOrderStatus: orderStatus,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log(
      `Status atualizado: ${email} => kiwify: ${orderStatus} => app: ${appStatus}`
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erro no webhook:", err);
    return res.status(500).json({ error: "Erro interno no webhook" });
  }
}
