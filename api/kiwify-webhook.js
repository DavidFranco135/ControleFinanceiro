import admin from "firebase-admin";

export default async function handler(req, res) {
  try {
    if (!process.env.FIREBASE_PRIVATE_KEY_BASE64) {
      throw new Error("ENV FIREBASE_PRIVATE_KEY_BASE64 não existe");
    }

    if (!admin.apps.length) {
      const decodedKey = Buffer.from(
        process.env.FIREBASE_PRIVATE_KEY_BASE64,
        "base64"
      ).toString("utf-8");

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: "planilha-fina",
          clientEmail: "firebase-adminsdk-fbsvc@planilha-fina.iam.gserviceaccount.com",
          privateKey: decodedKey,
        }),
      });
    }

    const data = req.body;
    console.log("WEBHOOK DATA:", JSON.stringify(data, null, 2));

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error("ERRO WEBHOOK:", error);
    return res.status(500).json({ error: "Erro interno no webhook" });
  }
}
