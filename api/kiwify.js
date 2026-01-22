// api/kiwify.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// ATENÇÃO: Você precisará gerar uma "Chave de Conta de Serviço" no console do Firebase
// e configurar como Variável de Ambiente no Vercel.
if (!initializeApp.length) {
    initializeApp();
}

const db = getFirestore();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const { customer, order_status } = req.body;

    // Se o status da ordem for 'paid' (pago)
    if (order_status === 'paid' || order_status === 'completed') {
        const email = customer.email.toLowerCase();
        const safeId = email.replace(/[^a-z0-9]/g, '_');

        try {
            const userRef = db.collection('users').doc(safeId);
            const userDoc = await userRef.get();

            if (userDoc.exists) {
                // Atualiza usuário existente para pago
                await userRef.update({ status: 'paid' });
            } else {
                // Se o usuário ainda não existir, cria ele já como pago
                // Ele usará o e-mail como senha temporária ou você pode definir uma padrão
                await userRef.set({
                    email: email,
                    password: email, // Senha inicial é o email dele
                    status: 'paid',
                    appName: 'Meu Perfil',
                    secondaryName: 'Conta 2',
                    createdAt: new Date()
                });
            }

            console.log(`Usuário ${email} ativado com sucesso!`);
            return res.status(200).send('User Activated');
        } catch (error) {
            console.error('Erro ao ativar usuário:', error);
            return res.status(500).send('Internal Error');
        }
    }

    return res.status(200).send('OK');
}
