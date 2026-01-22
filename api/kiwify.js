export default async function handler(req, res) {
  try {
    console.log("Webhook chamado");

    return res.status(200).json({
      ok: true,
      message: "Webhook funcionando"
    });

  } catch (err) {
    console.error("Erro interno:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
