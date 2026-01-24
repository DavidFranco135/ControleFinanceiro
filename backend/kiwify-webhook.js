import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

export default async function kiwifyWebhook(req, res) {import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

export default async function kiwifyWebhook(req, res) {
  try {
    const data = req.body;
    
    // 1. MAPEAMENTO SEGURO DE DADOS (Kiwify envia e-mail em lugares diferentes às vezes)
    const orderData = data?.order;
    const status = data?.order_status || orderData?.order_status; // Tenta pegar da raiz ou do objeto order
    
    // Tenta pegar o e-mail de todas as formas possíveis que a Kiwify envia
    const emailBruto = orderData?.Customer?.email || 
                       data?.Customer?.email || 
                       data?.customer?.email ||
                       orderData?.email;

    if (!emailBruto) {
      // Se ainda assim não achar, logamos o objeto inteiro para você ver no Render o que chegou
      console.error("❌ Webhook recebido sem email de cliente. Estrutura recebida:", JSON.stringify(data));
      return res.status(400).json({ error: "Email não encontrado" });
    }

    // 2. PADRONIZAÇÃO DO ID (IMPORTANTE)
    // Se no seu Front-end você usa safeId (com underlines), use a lógica abaixo.
    // Se no seu Firestore o documento é o próprio e-mail puro, mantenha apenas o trim.
    const emailNormalizado = emailBruto.toLowerCase().trim();
    const safeId = emailNormalizado.replace(/[^a-z0-9]/g, '_'); 

    const db = admin.firestore();
    
    // DICA: Verifique se no seu banco o ID é o e-mail puro ou o safeId. 
    // Se for e-mail puro, use: .doc(emailNormalizado)
    const userRef = db.collection("users").doc(safeId);

    console.log(`Operação: ${status} para o usuário: ${emailNormalizado}`);

    // 3. LÓGICA DE BLOQUEIO / LIBERAÇÃO
    if (status === "paid" || status === "approved") {
      await userRef.set({
        paid: true,
        status: 'paid', // Adicionado para manter consistência com o front
        kiwifyStatus: status,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`✅ Usuário Liberado: ${emailNormalizado}`);
    } 
    else if (status === "refunded" || status === "charged_back" || status === "disputed") {
      await userRef.set({
        paid: false,
        status: 'refunded', // Garante que o front reconheça o bloqueio
        kiwifyStatus: status,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`🚫 Usuário BLOQUEADO (Reembolso/Chargeback): ${emailNormalizado}`);
    }
    else {
      await userRef.set({
        kiwifyStatus: status,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("❌ Erro fatal no Webhook:", err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
}
  try {
    const data = req.body;
    
    // A Kiwify envia os dados dentro de 'order'
    const orderData = data?.order;
    const status = orderData?.order_status;
    const emailBruto = orderData?.Customer?.email;

    if (!emailBruto) {
      console.error("❌ Webhook recebido sem email de cliente.");
      return res.status(400).json({ error: "Email não encontrado" });
    }

    const email = emailBruto.toLowerCase().trim();
    const db = admin.firestore();
    const userRef = db.collection("users").doc(email);

    console.log(`Operação: ${status} para o usuário: ${email}`);

    // LÓGICA DE BLOQUEIO / LIBERAÇÃO
    if (status === "paid" || status === "approved") {
      // LIBERA ACESSO
      await userRef.set({
        paid: true,
        pending: false,
        kiwifyStatus: status,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`✅ Usuário Liberado: ${email}`);
    } 
    else if (status === "refunded" || status === "charged_back") {
      // BLOQUEIO AUTOMÁTICO POR REEMBOLSO
      await userRef.set({
        paid: false,
        pending: false, // Defina como false para bloquear o acesso se seu front checa 'paid'
        kiwifyStatus: status,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`🚫 Usuário BLOQUEADO (Reembolso): ${email}`);
    }
    else {
      // Outros status (ex: recusado, pendente)
      await userRef.set({
        kiwifyStatus: status,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("❌ Erro fatal no Webhook:", err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
}
