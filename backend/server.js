import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_KEY = process.env.GEMINI_KEY; // variável no Render

app.post("/gemini", async (req, res) => {
  try {
    const { mensagem } = req.body;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1:generateMessage?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: {
            messages: [
              {
                role: "system",
                content: [
                  {
                    type: "text",
                    text: `
Você é Niklaus, mentor financeiro brasileiro, direto, pragmático e experiente.
Gere 3 dicas financeiras estratégicas, objetivas e aplicáveis.
Use linguagem simples, tom encorajador e emojis moderados.
Responda **somente em português**.
                  `
                  }
                ]
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: mensagem
                  }
                ]
              }
            ]
          }
        })
      }
    );

    const data = await response.json();

    // 👀 Log para debug
    console.log("Resposta bruta da Gemini:", JSON.stringify(data, null, 2));

    // Parse robusto para diferentes formatos de resposta
    const texto =
      data?.candidates?.[0]?.content?.[0]?.text ||
      data?.output?.[0]?.content?.[0]?.text ||
      data?.text ||
      "⚠️ IA não retornou texto válido";

    res.json({ resposta: texto });

  } catch (err) {
    console.error("Erro Gemini:", err);
    res.status(500).json({ erro: "Erro na IA", detalhes: err.message });
  }
});

// Porta do Render normalmente é 10000+, mas 3000 funciona local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor IA Niklaus rodando na porta ${PORT}`);
});
