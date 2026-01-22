import admin from "firebase-admin";

if (!admin.apps.length) {
  const decodedKey = Buffer.from(
    process.env.FIREBASE_PRIVATE_KEY_BASE64,
    "base64"
  ).toString("utf-8");

  console.log("KEY START:", decodedKey.slice(0, 30));
  console.log("KEY END:", decodedKey.slice(-30));

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "planilha-fina",
      clientEmail: "firebase-adminsdk-fbsvc@planilha-fina.iam.gserviceaccount.com",
      privateKey: decodedKey,
    }),
  });
}
