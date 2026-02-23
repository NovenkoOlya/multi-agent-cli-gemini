// llm.js
let GoogleGenAI = null;
try {
  // optional dependency runtime import
  ({ GoogleGenAI } = await import("@google/genai"));
} catch {
  // If package isn't installed, we still can run in mock mode.
}

/**
 * Parse CLI args like --key=..., --llm, etc.
 */
export function parseArgs(argv) {
  const args = argv.slice(2);
  const map = {};
  for (const a of args) {
    if (a.startsWith("--") && a.includes("=")) {
      const [k, v] = a.slice(2).split("=");
      map[k] = v;
    } else if (a.startsWith("--")) {
      map[a.slice(2)] = true;
    }
  }
  return map;
}

function mockRespond(agent, task, context) {
    const t = (task || "").toLowerCase();
  
    // --- TECH AGENT ---
    if (agent.id === "tech") {
      const techKeywords = [
        "node", "api", "database", "db", "server",
        "architecture", "code", "bug", "debug",
        "backend", "frontend", "endpoint", "cache"
      ];
  
      const inScope = techKeywords.some(k => t.includes(k));
      if (!inScope) return "OUT_OF_SCOPE";
  
      return [
        "- Clarify technical constraints (stack, hosting, deadline).",
        "- Define architecture (API layer, database, validation).",
        "- Implement minimal version (MVP endpoint + storage).",
        "- Add basic error handling and logging.",
        "- Write simple test cases and validate edge cases."
      ].join("\n");
    }
  
    // --- BUSINESS AGENT ---
    if (agent.id === "business") {
      const businessKeywords = [
        "kpi", "metric", "users", "conversion",
        "revenue", "product", "experiment",
        "feature", "scope", "priority", "market"
      ];
  
      const inScope = businessKeywords.some(k => t.includes(k));
      if (!inScope) return "OUT_OF_SCOPE";
  
      return [
        "Clarifying questions:",
        "- What is the primary goal (growth, revenue, retention)?",
        "- What KPI defines success?",
        "",
        "Proposed approach:",
        "- Define measurable success criteria.",
        "- Break feature into deliverable milestones.",
        "- Align scope with timeline and resources.",
        "",
        "Risks / assumptions:",
        "- Undefined target audience.",
        "- Overestimated impact without data validation.",
        "- Scope creep during implementation."
      ].join("\n");
    }
  
    // --- LEGAL AGENT ---
    if (agent.id === "legal") {
      const legalKeywords = [
        "gdpr", "privacy", "consent",
        "personal data", "compliance",
        "policy", "security", "terms"
      ];
  
      const inScope = legalKeywords.some(k => t.includes(k));
      if (!inScope) return "OUT_OF_SCOPE";
  
      return [
        "Key considerations:",
        "- Define lawful basis for data processing.",
        "- Ensure user consent is explicit and documented.",
        "- Apply data minimization principle.",
        "",
        "Potential risks:",
        "- Collecting data without proper notice.",
        "- Lack of audit trail for consent.",
        "",
        "Suggested next steps:",
        "- Update privacy policy.",
        "- Implement consent logging.",
        "- Consult a qualified legal professional."
      ].join("\n");
    }
  
    return `Mock response for ${agent.id}`;
  }
  
async function geminiRespond({ apiKey, model, agent, task, context }) {
  if (!GoogleGenAI) throw new Error("Gemini SDK not available. Install @google/genai or run mock mode.");
  const ai = new GoogleGenAI({ apiKey });

  // We keep it simple: one-shot per run; context comes from operator notes + chosen drafts.
  const contents = [
    {
      role: "user",
      parts: [
        {
          text:
            `TASK:\n${task}\n\n` +
            `OPERATOR CONTEXT (if any):\n${context || "(none)"}\n\n` +
            `INSTRUCTIONS:\nFollow your role rules strictly.\n` +
            `Return a concise, structured answer.`
        }
      ]
    }
  ];

  const res = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: agent.rules,
      // Optional tuning:
      // temperature: 0.2,
      maxOutputTokens: 2000,
    }
  });

  return res.text ?? "";
}

/**
 * Main function: returns agent output.
 * - If useLLM = true and apiKey present => Gemini
 * - Otherwise => mock
 */
export async function runAgent({ agent, task, context, useLLM, apiKey, model }) {
  if (useLLM && apiKey) {
    try {
      return await geminiRespond({ apiKey, model, agent, task, context });
    } catch (e) {
      // fallback to mock if Gemini fails (quota, network, etc.)
      return `LLM_ERROR_FALLBACK_TO_MOCK: ${e?.message || e}\n\n` + mockRespond(agent, task, context);
    }
  }
  return mockRespond(agent, task, context);
}