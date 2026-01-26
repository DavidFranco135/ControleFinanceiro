import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Inicializa Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

const db = admin.firestore();

// =====================
// Rotas existentes (ex: Kiwify webhook)
// =====================
app.post("/kiwify-webhook", async (req, res) => {
  const data = req.body?.order || req.body;

  console.log("Webhook recebido:", JSON.stringify(data, null, 2));

  // Aqui você já salva a sugestão ou compra no Firestore
  // Exemplo de sugestão:
  if (data.sugestao) {
    await db.collection("sugestoes").add({
      userId: data.userId,
      mensagem: data.sugestao,
      data: admin.firestore.FieldValue.serverTimestamp(),
      respondido: false
    });
  }

  res.status(200).send("Webhook recebido!");
});

// =====================
// Nova rota: enviar mensagem de admin para usuário
// =====================
app.post("/enviar-mensagem", async (req, res) => {
  try {
    const { userId, mensagem } = req.body;

    if (!userId || !mensagem) {
      return res.status(400).json({ erro: "Faltando userId ou mensagem" });
    }

    await db.collection("mensagens").add({
      de: "admin",
      para: userId,
      mensagem,
      data: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ sucesso: true, msg: "Mensagem enviada ao usuário!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao enviar mensagem" });
  }
});

// =====================
// Rota opcional: listar usuários (para painel admin)
// =====================
app.get("/usuarios", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const usuarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao listar usuários" });
  }
});

// =====================
// Inicia servidor
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
