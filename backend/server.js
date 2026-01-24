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
app.post("/gemini", async (req, res) => {
  try {
    const { mensagem, nomeUsuario } = req.body; // Recebendo o nome do usuário do front-end

    if (!process.env.GROQ_KEY) {
      return res.status(500).json({ erro: "Configuração do servidor incompleta." });
    }

    // Lista de temas para forçar a IA a não repetir piadas
    const temasPiadas = [
      "investimentos", "bancos", "dinheiro antigo", "casamento", 
      "tecnologia", "animais", "esportes", "profissões", "viagem no tempo"
    ];
    const temaAleatorio = temasPiadas[Math.floor(Math.random() * temasPiadas.length)];

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Você é Niklaus, um mentor financeiro brasileiro sofisticado e bem-humorado. 
          
          REGRAS:
          1. Apresente-se como Niklaus.
          2. Use o nome ${nomeUsuario || 'meu caro'} no início.
          3. Gere 3 dicas financeiras estratégicas, curtas e de alto impacto.
          4. Use emojis interativos e variados.
          5. NUNCA faça perguntas ao usuário.
          6. OBRIGATÓRIO: Conte uma piada inédita sobre o tema "${temaAleatorio}". 
          7. Varie o estilo da piada (pode ser estilo 'o que é o que é', 'narrativa curta' ou 'trocadilho').`
        },
        { role: "user", content: mensagem }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8, // Aumentado levemente para maior criatividade nas piadas
      max_tokens: 1000,
    });

    res.json({ resposta: completion.choices[0]?.message?.content });
    console.log(`✅ Niklaus respondeu sobre o tema: ${temaAleatorio}`);

  } catch (err) {
    console.error("❌ Erro na Groq:", err.message);
    res.status(500).json({ erro: "Niklaus está offline", detalhes: err.message });
  }
});

// --- ROTA DO WEBHOOK KIWIFY (A que estava faltando) ---
// No painel da Kiwify, a URL deve ser: https://controlefinanceiro-naip.onrender.com/webhook-kiwify
app.post("/webhook-kiwify", kiwifyWebhook);

app.get("/", (req, res) => res.send("Servidor do Niklaus está Online! 🚀"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
