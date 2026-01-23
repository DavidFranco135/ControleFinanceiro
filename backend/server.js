import express from "express";
import cors from "cors";
import { GoogleGenAI } from "gemini-ai-sdk";

const app = express();
app.use(cors());
app.use(express.json());

const AI_KEY = process.env.GEMINI_API_KEY;

app.post("/ai", async (req, res) => {
  const { totals, currentTransactions, userQuestion } = req.body;
  try {
    const ai = new GoogleGenAI({ apiKey: AI_KEY });

    const summary = `
Total de Entradas: R$ ${totals.inc}
Total de Saídas: R$ ${totals.exp}
Saldo Atual: R$ ${totals.bal}
Principais transações: ${currentTransactions
      .slice(0,5)
      .map(t => `${t.description} (R$ ${t.amount})`)
      .join(", ")}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Pergunta: ${userQuestion}. Contexto financeiro: ${summary}`,
      config: { systemInstruction: "Você é Niklaus, mentor financeiro brasileiro, direto e motivador." }
    });

    res.json({ reply: response.text });
  } catch (err) {
    console.error(err);
    res.json({ reply: `Dicas do Niklaus:\n1. 💸 Estanque os pequenos vazamentos...\n2. 📈 Pague-se primeiro...\n3. 🚀 O segredo não é o quanto você ganha, mas o quanto mantém.` });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
