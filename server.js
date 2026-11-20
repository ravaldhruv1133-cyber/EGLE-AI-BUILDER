import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(process.env.AI_API_KEY) });
});

app.post("/api/generate", async (req, res) => {
  const prompt = String(req.body?.prompt || "").trim();
  if (prompt.length < 8) return res.status(400).json({ error: "Please describe the website in a little more detail." });
  if (prompt.length > 5000) return res.status(400).json({ error: "Prompt is too long. Please keep it under 5,000 characters." });

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return res.status(503).json({
    error: "AI is not connected yet. Add your AI provider key to the server's .env file. The demo preview still works without it."
  });

  const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  const systemPrompt = `You are EGLE AI BUILDER, an expert website generator. Return ONLY a complete standalone HTML document.
Requirements:
- Include all CSS in a <style> tag and JavaScript in a <script> tag.
- Make it polished, modern, responsive for phones, tablets and desktop.
- Build a complete useful page based on the user's prompt, not a generic placeholder.
- Use semantic HTML, accessible labels, sensible contrast and working navigation/interactions where feasible.
- Do not include markdown fences or explanations.
- Do not claim external payments, login, database, email, or publishing work unless it is actually implemented client-side.
- Avoid external dependencies; use CSS and vanilla JavaScript.`;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ]
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(502).json({ error: data?.error?.message || "The AI provider could not generate the website. Check your model and API settings." });
    }
    let html = data?.choices?.[0]?.message?.content || "";
    html = html.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();
    if (!/<html[\s>]/i.test(html) && !/^<!doctype html/i.test(html)) {
      return res.status(502).json({ error: "The AI response was not a complete HTML page. Please try a more specific prompt." });
    }
    res.json({ html });
  } catch (err) {
    console.error("Generation error:", err);
    res.status(500).json({ error: "Could not reach the AI service. Please try again." });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`EGLE AI BUILDER running on http://localhost:${port}`));
