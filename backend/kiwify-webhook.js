import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      ),
    });
  } catch (error) {
    console.error("Erro ao inicializar Firebase Admin:", error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const data = req.body;

    const email =
      data?.Customer?.email ||
      data?.customer?.email ||
      data?.buyer?.email ||
      data?.order?.customer?.email ||
      null;

    if (!email) {
      return res.status(400).json({ error: "Email não encontrado no corpo da requisição" });
    }

    const db = admin.firestore();

    await db.collection("users").doc(email).set(
      {
        paid: true,
        pending: false,
        paidAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erro no Webhook:", err);
    return res.status(500).json({ error: "Erro interno no processamento do webhook" });
  }
}
