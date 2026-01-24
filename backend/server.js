import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
// IMPORTANTE: Importar o arquivo do webhook
import kiwifyWebhook from './kiwify-webhook.js'; 

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_KEY,
});

// --- ROTA DA IA NIKLAUS ---
// server.js ou app.js
const temasPiadas = ["investimentos", "bancos", "boletos", "cartão de crédito", "cripto", "inflação", "aposentadoria"];



app.post("/gemini", async (req, res) => {
  try {
    const { mensagem, nomeUsuario } = req.body;
    const temaAleatorio = temasPiadas[Math.floor(Math.random() * temasPiadas.length)];

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Você é Niklaus, mentor financeiro. Nome do usuário: ${nomeUsuario || 'Amigo'}. 
          Apresente-se, dê 3 dicas curtas com emojis e conte uma piada inédita sobre ${temaAleatorio}. 
          Seja direto e rápido.`
        },
        { role: "user", content: mensagem }
      ],
      // MODELO INSTANTÂNEO PARA VELOCIDADE MÁXIMA
      model: "llama-3.1-8b-instant", 
      temperature: 0.9, // Mais criatividade nas piadas
    });

    res.json({ resposta: completion.choices[0]?.message?.content });
  } catch (err) {
    res.status(500).json({ erro: "Niklaus deu uma saidinha." });
  }
});

// --- ROTA DO WEBHOOK KIWIFY (A que estava faltando) ---
// No painel da Kiwify, a URL deve ser: https://controlefinanceiro-naip.onrender.com/webhook-kiwify
app.post("/webhook-kiwify", kiwifyWebhook);

app.get("/", (req, res) => res.send("Servidor do Niklaus está Online! 🚀"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
