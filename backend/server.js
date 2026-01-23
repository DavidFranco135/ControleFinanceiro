import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import kiwifyHandler from "./api/kiwify-webhook.js"; // seu webhook

const app = express();
app.use(cors());
app.use(express.json());

// Inicializa Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

// Rota webhook
app.post("/kiwify-webhook", kiwifyHandler);

// Aqui você pode adicionar rota para a IA Niklaus se quiser
app.post("/ai", async (req, res) => {
  // Código da Gemini AI aqui
  res.json({ reply: "Resposta da IA..." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend rodando na porta ${PORT}`));
