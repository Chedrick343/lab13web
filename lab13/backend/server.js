import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/api/chat", async (req, res) => {
  try {
    const { pregunta, contexto } = req.body;

    const sistema = `
Eres el asistente virtual del Banco Damena.
Responde de forma:
- formal
- clara
- empática
- NO inventes datos que no están en el sistema local.
- Si el sistema no tiene información, aclara que no está disponible.
- Usa el contexto local JSON enviado por el frontend para responder al usuario.
    `;

    const contextoTexto = `Contexto del sistema:\n${JSON.stringify(contexto, null, 2)}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sistema },
        { role: "user", content: pregunta },
        { role: "assistant", content: contextoTexto }
      ],
      max_tokens: 300
    });

    res.json({
      respuesta: completion.choices[0].message.content
    });
  } catch (error) {
    console.error("Error en /api/chat:", error);
    res.status(500).json({ error: "Error interno al procesar la solicitud" });
  }
});

app.listen(3000, () => {
  console.log("Servidor backend corriendo en http://localhost:3000");
});
