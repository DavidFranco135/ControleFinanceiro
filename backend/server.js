import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Inicializa a IA com a biblioteca oficial
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

app.post("/gemini", async (req, res) => {
  try {
    const { mensagem } = req.body;

    if (!process.env.GEMINI_KEY) {
      return res.status(500).json({ erro: "Chave API não configurada." });
    }

    // Usando o modelo mais estável via SDK
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Você é Niklaus, mentor financeiro brasileiro, direto e pragmático. 
    Gere 3 dicas financeiras estratégicas e objetivas para estes dados: ${mensagem}. 
    Responda em português com emojis moderados.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Niklaus respondeu com sucesso!");
    res.json({ resposta: text });

  } catch (err) {
    console.error("Erro na IA Niklaus:", err);
    
    // Se der erro de "model not found", tentamos o pro
    try {
        const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await modelPro.generateContent(mensagem);
        const response = await result.response;
        return res.json({ resposta: response.text() });
    } catch (secondErr) {
        res.status(500).json({ erro: "Erro ao conectar com a IA", detalhes: err.message });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Niklaus Online com SDK Oficial`));
