import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

export default async function handler(req, res) {
  // Kiwify envia via POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Apenas POST permitido" });
  }

  try {
    const data = req.body;
    
    // Log para você ver exatamente o que a Kiwify enviou (olhe nos logs da Vercel)
    console.log("Dados recebidos da Kiwify:", JSON.stringify(data));

    const email =
      data?.Customer?.email ||
      data?.customer?.email ||
      data?.buyer?.email ||
      data?.order?.customer?.email ||
      null;

    if (!email) {
      console.error("ERRO: Email não encontrado no corpo da requisição.");
      return res.status(400).json({ error: "Email não encontrado" });
    }

    const db = admin.firestore();
    const userEmail = email.toLowerCase().trim(); // Padroniza para evitar erros

    // Salva no Firestore
    await db.collection("users").doc(userEmail).set(
      {
        paid: true,
        pending: false,
        status: data.order_status || "approved", // Opcional: salva o status da Kiwify
        paidAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log(`✅ Acesso liberado com sucesso para: ${userEmail}`);
    return res.status(200).json({ ok: true, message: "Acesso liberado" });

  } catch (err) {
    console.error("❌ Erro fatal no Webhook:", err);
    return res.status(500).json({ error: "Erro interno", details: err.message });
  }
}
