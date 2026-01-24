import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

// Certifique-se de ter configurado a variável no Render: GEMINI_KEY
const GEMINI_KEY = process.env.GEMINI_KEY;

app.post("/gemini", async (req, res) => {
  try {
    const { mensagem } = req.body;

    // Cria o cliente da Gemini
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

    // Prompt do Niklaus
    const promptText = `
Você é Niklaus, mentor financeiro brasileiro, direto, pragmático e experiente.
Gere 3 dicas financeiras estratégicas, objetivas e aplicáveis.
Use linguagem simples, tom encorajador e emojis moderados.
Responda somente em português.

Dados do usuário:
${mensagem}
    `;

    // Chamada ao modelo Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3", // modelo disponível
      contents: promptText,
      config: {
        systemInstruction: "Você é Niklaus, mentor financeiro experiente, pragmático e direto. Dê 3 dicas financeiras em português com emojis moderados."
      }
    });

    const texto = response?.text || "⚠️ IA não retornou texto válido";

    res.json({ resposta: texto });

  } catch (err) {
    console.error("Erro Gemini:", err);
    res.status(500).json({ erro: "Erro na IA", detalhes: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor IA Niklaus rodando na porta ${PORT}`);
});
