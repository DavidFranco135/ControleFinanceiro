import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "planilha-fina",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req, res) {
  const event = req.body.event;
  const email = req.body.customer?.email?.toLowerCase();

  if (!email) return res.status(400).send("Email ausente");

  const snap = await admin.firestore()
    .collection("users")
    .where("email", "==", email)
    .get();

  snap.forEach(async (doc) => {
    if (event === "order_approved") await doc.ref.update({ status: "paid" });
    if (event === "refund") await doc.ref.update({ status: "refunded" });
  });

  res.status(200).send("OK");
}
