const express = require("express");
const OpenAI = require("openai");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json({ limit: "10mb" })); // importante para imágenes base64
app.use(express.static(path.join(__dirname, "public")));

// Ruta simple para comprobar que la app está viva
app.get("/", (req, res) => {
  res.send("Agente online");
});

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message || "";
    const extraData = req.body.data || null;
    const imageBase64 = req.body.imageBase64 || null; // data:image/...;base64,...

    const systemPrompt = `
Eres mi agente personal. Responde claro y directo en español.
Si el usuario te manda datos en "data" o una imagen, tenlo en cuenta.
Describe con precisión lo que veas en la imagen si la hay.
`;

    const userContent = [];

    if (userMessage) {
      userContent.push({
        type: "text",
        text: userMessage
      });
    }

    if (extraData) {
      userContent.push({
        type: "text",
        text: `Datos adicionales del usuario: ${JSON.stringify(extraData)}`
      });
    }

    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: imageBase64
        }
      });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini", // asegúrate de que tu cuenta soporta visión con este modelo
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: userContent
        }
      ]
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    if (err.code === "insufficient_quota") {
      return res.status(503).json({
        error: "El modelo no tiene saldo. Revisa la cuenta de OpenAI."
      });
    }
    res.status(500).json({ error: "Error en el agente" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Agente escuchando en puerto ${port}`);
});
