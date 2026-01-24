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

        if (!process.env.GROQ_KEY) {
            return res.status(500).json({ erro: "Chave da API não configurada." });
        }

        // Seleciona um tema aleatório para a piada ser sempre diferente
        const temaAleatorio = temasPiadas[Math.floor(Math.random() * temasPiadas.length)];

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Você é Niklaus, um mentor financeiro brasileiro sofisticado e engraçado.
                    REGRAS:
                    1. Comece saudando o(a) ${nomeUsuario || 'Investidor(a)'} pelo nome.
                    2. Dê 3 dicas financeiras curtas e úteis com emojis.
                    3. Conte uma piada curta e inédita sobre o tema: ${temaAleatorio}.
                    4. Não faça perguntas ao usuário. Seja direto.`
                },
                { role: "user", content: mensagem }
            ],
            model: "llama-3.1-8b-instant", // Versão ultra rápida
            temperature: 0.85, 
        });

        res.json({ resposta: completion.choices[0]?.message?.content });
        console.log(`✅ Niklaus respondeu sobre ${temaAleatorio}`);

    } catch (err) {
        console.error("❌ Erro:", err.message);
        res.status(500).json({ erro: "Niklaus offline", detalhes: err.message });
    }
});

// --- ROTA DO WEBHOOK KIWIFY (A que estava faltando) ---
// No painel da Kiwify, a URL deve ser: https://controlefinanceiro-naip.onrender.com/webhook-kiwify
app.post("/webhook-kiwify", kiwifyWebhook);

app.get("/", (req, res) => res.send("Servidor do Niklaus está Online! 🚀"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
