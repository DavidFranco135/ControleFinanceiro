// api/ai.js
import { GoogleGenAI } from 'gemini-ai-sdk';

export default async function handler(req, res) {
    const { userQuestion, totals, currentTransactions } = req.body;

    try {
        // Inicializa a Gemini AI com a chave do ambiente
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // Resumo financeiro do usuário
        const summary = `
Total de Entradas: R$ ${totals.inc.toLocaleString('pt-BR')}
Total de Saídas: R$ ${totals.exp.toLocaleString('pt-BR')}
Saldo Atual: R$ ${totals.bal.toLocaleString('pt-BR')}
Principais transações recentes: ${currentTransactions
            .slice(0,5)
            .map(t => `${t.description} (R$ ${t.amount})`)
            .join(', ')}
        `;

        // Solicitação à IA
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `
Pergunta do usuário: ${userQuestion}
Responda como Niklaus, mentor financeiro brasileiro, direto, motivador e pragmático.
Contexto financeiro: ${summary}
            `,
            config: {
                systemInstruction: "Você é Niklaus, mentor financeiro pessoal brasileiro, direto e motivador."
            }
        });

        res.status(200).json({ reply: response.text });

    } catch (err) {
        console.error("Erro na IA:", err);
        res.status(500).json({
            reply: `
Dicas do Niklaus para o seu momento:

1. 💸 Estanque os pequenos vazamentos: revise assinaturas e gastos desnecessários.
2. 📈 Pague-se primeiro: separe sua reserva antes de qualquer gasto.
3. 🚀 Foque em manter e multiplicar o que você já tem.
            `
        });
    }
}
