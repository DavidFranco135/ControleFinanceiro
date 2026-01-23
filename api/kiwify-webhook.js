import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

export default async function handler(req, res) {
  const data = req.body;

  // Email do comprador vindo do Kiwify
  const email = data?.customer?.email;

  if (!email) {
    return res.status(400).json({ error: "Email não encontrado no webhook" });
  }

  const db = admin.firestore();

  await db.collection("users").doc(email).set({
    access: true,
    paid: true,
    paidAt: new Date().toISOString(),
  }, { merge: true });

  return res.status(200).json({ ok: true });
}
