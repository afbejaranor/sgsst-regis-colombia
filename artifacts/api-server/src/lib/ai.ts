import { logger } from "./logger";

const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

export async function callAI(systemPrompt: string, userMessage: string): Promise<unknown> {
  const apiKey = process.env["OPENROUTER_API_KEY"];
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const response = await fetch(OPENROUTER_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://sgsst-regis.replit.app",
      "X-Title": "SG-SST Regis Colombia",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    logger.error({ err, status: response.status }, "OpenRouter API error");
    throw new Error(`OpenRouter API error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const text = data.choices[0]?.message?.content ?? "";

  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/);
  const clean = jsonMatch ? jsonMatch[1].trim() : text.trim();

  try {
    return JSON.parse(clean);
  } catch {
    logger.warn({ text }, "AI response was not valid JSON, returning raw");
    return { raw: text, parse_error: true };
  }
}
