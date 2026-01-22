import admin from "firebase-admin";

// Corrige quebra de linha da chave privada no Vercel
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
    })
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const data = req.body;

    // email do comprador vindo da Kiwify
    const email = data?.Customer?.email || data?.customer?.email;

    // status do pagamento
    const status = data?.order_status || data?.status;

    if (!email) {
      return res.status(400).json({ error: "Email não encontrado" });
    }

    // 🔓 PAGAMENTO APROVADO
    if (status === "paid") {
      await db.collection("usuarios").doc(email).set({
        email: email,
        paid: true,
        status: "ativo",
        plano: "premium",
        liberado_em: new Date()
      }, { merge: true });

      return res.status(200).json({ ok: true, acesso: "liberado" });
    }

    // 🔒 REEMBOLSO / BLOQUEIO
    if (status === "refunded" || status === "chargeback") {
      await db.collection("usuarios").doc(email).set({
        paid: false,
        status: "bloqueado"
      }, { merge: true });

      return res.status(200).json({ ok: true, acesso: "bloqueado" });
    }

    return res.status(200).json({ ok: true, status: "ignorado" });

  } catch (err) {
    console.error("Erro webhook:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
