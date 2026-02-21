import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

const ai = new GoogleGenAI({ apiKey });

function toUserContent(text) {
  return { role: "user", parts: [{ text }] };
}

function toModelContent(text) {
  return { role: "model", parts: [{ text }] };
}

/**
 * Реальний запит до Gemini.
 * history = масив {role:"user"|"model", parts:[{text:"..."}]}
 */
export async function askAgent({ model, agent, userText, history }) {
  const contents = [...history, toUserContent(userText)];

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      // system instruction = роль агента
      systemInstruction: agent.instructions,
      // трохи контролюємо витрати/балакучість
      // (поле залежить від SDK, але цей підхід загальний)
      // maxOutputTokens: 300,
      // temperature: 0.4,
    }
  });

  const text = response.text ?? "";
  const newHistory = [...contents, toModelContent(text)];

  return { text, history: newHistory };
}