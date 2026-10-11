const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

app.use(express.json());

app.post("/api/bridge", async (req, res) => {
  const { text, chat_id } = req.body || {};

  if (!text || !chat_id) {
    return res.status(400).json({ ok: false, error: "text and chat_id are required" });
  }

  if (!TELEGRAM_BOT_TOKEN) {
    return res.status(500).json({ ok: false, error: "TELEGRAM_BOT_TOKEN is not set" });
  }

  try {
    const telegramResponse = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      { chat_id, text }
    );

    return res.status(telegramResponse.status).json(telegramResponse.data);
  } catch (error) {
    const status = error.response?.status || 502;
    const data = error.response?.data || { ok: false, error: error.message };

    return res.status(status).json(data);
  }
});

app.post("/api/tg-webhook", async (req, res) => {
  try {
    const upstream = await axios.post(
      "https://etalonklimat.ru/api/telegram-webhook",
      req.body,
      {
        headers: { "Content-Type": "application/json" },
        validateStatus: () => true,
      }
    );

    return res.status(upstream.status).json(upstream.data);
  } catch (error) {
    const status = error.response?.status || 502;
    const data = error.response?.data || { ok: false, error: error.message };
    console.error("tg-webhook forward failed:", error.message);
    return res.status(status).json(data);
  }
});

app.listen(PORT, () => {
  console.log(`Bridge listening on port ${PORT}`);
});
