import admin from "firebase-admin";

function getEnv(name) {
  if (!process.env[name]) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }
  return process.env[name];
}

let app;

try {
  if (!admin.apps.length) {
    const privateKey = getEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, '\n');

    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: getEnv("FIREBASE_PROJECT_ID"),
        clientEmail: getEnv("FIREBASE_CLIENT_EMAIL"),
        privateKey: privateKey
      })
    });
  }
} catch (e) {
  console.error("🔥 ERRO FIREBASE INIT:", e);
}

const db = admin.firestore();

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const data = req.body;

    console.log("📦 Payload recebido:", JSON.stringify(data, null, 2));

    const email =
      data?.Customer?.email ||
      data?.customer?.email ||
      data?.buyer?.email;

    const status =
      data?.order_status ||
      data?.status ||
      data?.order?.status;

    if (!email) {
      return res.status(400).json({ error: "Email não encontrado no payload" });
    }

    if (status === "paid") {
      await db.collection("usuarios").doc(email).set({
        email,
        paid: true,
        status: "ativo",
        plano: "premium",
        updated_at: new Date()
      }, { merge: true });

      return res.status(200).json({ ok: true, acesso: "liberado" });
    }

    if (status === "refunded" || status === "chargeback") {
      await db.collection("usuarios").doc(email).set({
        paid: false,
        status: "bloqueado",
        updated_at: new Date()
      }, { merge: true });

      return res.status(200).json({ ok: true, acesso: "bloqueado" });
    }

    return res.status(200).json({ ok: true, status: "ignorado" });

  } catch (err) {
    console.error("💥 ERRO WEBHOOK:", err);
    return res.status(500).json({ error: "Erro interno", detalhe: err.message });
  }
}
