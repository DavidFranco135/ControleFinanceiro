import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_KEY = process.env.GEMINI_KEY;

app.post("/gemini", async (req, res) => {
  try {
    const { mensagem } = req.body;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `
Você é Niklaus, um mentor financeiro pessoal brasileiro extremamente experiente,
pragmático, direto ao ponto e focado em prosperidade real.

Regras:
- Claro
- Estratégico
- Prático
- Sem frases genéricas
- Sem motivação vazia
- Ações reais
- Linguagem simples
- Emojis moderados

Missão:
Gerar 3 dicas financeiras estratégicas, objetivas e aplicáveis.

Dados do usuário:
${mensagem}
              `
            }]
          }]
        })
      }
    );

    const data = await response.json();

    // 👇 LOG REAL PRA DEBUG
    console.log("Resposta bruta da Gemini:", JSON.stringify(data, null, 2));

    let texto = 
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.output_text ||
      data?.text ||
      null;

    if (!texto) {
      texto = "⚠️ IA não retornou texto válido. Estrutura inesperada da resposta.";
    }

    res.json({ resposta: texto });

  } catch (err) {
    console.error("Erro Gemini:", err);
    res.status(500).json({ erro: "Erro na IA", detalhes: err.message });
  }
});

app.listen(3000, () => {
  console.log("🚀 Servidor IA Niklaus rodando na porta 3000");
});
