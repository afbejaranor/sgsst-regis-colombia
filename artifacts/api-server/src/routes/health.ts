import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { callAI } from "../lib/ai";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.get("/health/ai", async (_req, res) => {
  const MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
  const apiKey = process.env["OPENROUTER_API_KEY"];
  if (!apiKey) {
    return res.json({ status: "no_key", model: MODEL, message: "OPENROUTER_API_KEY no configurada" });
  }
  try {
    const start = Date.now();
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://sgsst-regis.replit.app",
        "X-Title": "SG-SST Regis Colombia",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: 'Responde solo este JSON sin texto extra: {"conexion":"ok","modelo":"activo"}' }],
        max_tokens: 60,
        temperature: 0,
      }),
    });
    const elapsed = Date.now() - start;
    if (!response.ok) {
      const errText = await response.text();
      return res.json({ status: "api_error", model: MODEL, http_status: response.status, error: errText, elapsed_ms: elapsed });
    }
    const data = await response.json() as { choices?: Array<{ message: { content: string } }> };
    const text = (data.choices?.[0]?.message?.content ?? "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    return res.json({ status: "ok", model: MODEL, response: text, elapsed_ms: elapsed });
  } catch (err) {
    return res.json({ status: "connection_error", model: MODEL, error: String(err) });
  }
});

// Diagnostic: tests the exact same callAI() function used by matrices/examenes/actas
router.get("/health/ai/full", async (_req, res) => {
  const start = Date.now();
  try {
    const result = await callAI(
      "Eres un asistente de prueba. Responde SOLO con JSON válido.",
      'Responde exactamente: {"test":"ok","mensaje":"callAI funciona correctamente"}'
    );
    return res.json({ status: "ok", elapsed_ms: Date.now() - start, result });
  } catch (err) {
    return res.json({ status: "error", elapsed_ms: Date.now() - start, error: String(err) });
  }
});

export default router;
