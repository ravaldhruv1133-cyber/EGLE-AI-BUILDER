import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({ limit: "8mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => res.json({ ok: true, aiConfigured: Boolean(process.env.AI_API_KEY), model: process.env.AI_MODEL || "gpt-4o-mini" }));

async function askAI(messages, res) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI is not connected yet. In Render, open your service → Environment and add AI_API_KEY. Then redeploy." });
  const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.AI_MODEL || "gpt-4o-mini", temperature: 0.65, messages })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(502).json({ error: data?.error?.message || "AI provider error. Check the API key, model and billing." });
    let html = String(data?.choices?.[0]?.message?.content || "").replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();
    if (!/<html[\s>]/i.test(html) && !/^<!doctype html/i.test(html)) return res.status(502).json({ error: "AI did not return a complete HTML page. Please try again with a clearer instruction." });
    return res.json({ html });
  } catch (error) {
    console.error("AI request failed:", error);
    return res.status(500).json({ error: "Could not connect to the AI service. Please try again." });
  }
}

const systemPrompt = `You are EGLE AI BUILDER, an expert product designer and frontend developer. Return ONLY one complete, standalone HTML document. Put all CSS in <style> and JavaScript in <script>. Create polished, original, responsive and accessible pages with useful content and working client-side interactions. Use semantic HTML, mobile-first layout, sensible contrast and no markdown fences. Avoid dependencies unless truly useful. Never claim that a backend, real authentication, payments, database, email or publishing exists unless implemented. Keep all requested existing functionality when modifying a page.`;

app.post("/api/generate", async (req, res) => {
  const prompt = String(req.body?.prompt || "").trim();
  if (prompt.length < 8) return res.status(400).json({ error: "Please describe your website in a little more detail." });
  if (prompt.length > 5000) return res.status(400).json({ error: "Prompt is too long. Keep it under 5,000 characters." });
  return askAI([{ role: "system", content: systemPrompt }, { role: "user", content: `Build this website: ${prompt}` }], res);
});

app.post("/api/modify", async (req, res) => {
  const instruction = String(req.body?.instruction || "").trim();
  const html = String(req.body?.html || "");
  if (instruction.length < 2) return res.status(400).json({ error: "Type what you want to change." });
  if (!html.toLowerCase().includes("<html") || html.length > 1500000) return res.status(400).json({ error: "The current website is missing or too large to edit." });
  if (instruction.length > 3000) return res.status(400).json({ error: "Please keep your edit instruction under 3,000 characters." });
  return askAI([
    { role: "system", content: systemPrompt + " You are editing an existing website. Apply only the user's requested changes, preserve unrelated layout/content/features, and return the entire updated HTML document." },
    { role: "user", content: `CURRENT WEBSITE HTML:\n${html}\n\nUSER CHANGE REQUEST:\n${instruction}\n\nReturn the complete updated HTML.` }
  ], res);
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`EGLE AI BUILDER running on port ${port}`));
