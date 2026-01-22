export default async function handler(req, res) {
  try {
    console.log("METHOD:", req.method);
    console.log("BODY:", req.body);

    return res.status(200).json({
      ok: true,
      received: true
    });

  } catch (err) {
    console.error("Erro:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
