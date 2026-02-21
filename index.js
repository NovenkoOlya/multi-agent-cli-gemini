import "dotenv/config";
import readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";

import { AGENTS, getAgentById } from "./agents.js";
import { askAgent } from "./llm.js";

const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (!process.env.GEMINI_API_KEY) {
  console.log("❌ Нема GEMINI_API_KEY. Створи .env на основі .env.example");
  process.exit(1);
}

const state = {
  activeAgentId: AGENTS[0].id,
  multiAgentMode: false,
  historyByAgent: Object.fromEntries(AGENTS.map(a => [a.id, []])) // окрема памʼять на агента
};

function header() {
  console.log("=== AI Agents CLI Chat (Gemini / Google AI Studio) ===");
  console.log(`Model: ${model}`);
  console.log("Commands:");
  console.log("  /agents           - list agents");
  console.log("  /use <agentId>    - choose active agent");
  console.log("  /all on|off       - all agents respond");
  console.log("  /reset            - reset memory (all agents)");
  console.log("  /exit             - quit");
  console.log("");
  console.log(`Active agent: ${state.activeAgentId}`);
  console.log(`Multi-agent: ${state.multiAgentMode ? "ON" : "OFF"}`);
  console.log("");
}

function listAgents() {
  console.log("Agents:");
  for (const a of AGENTS) console.log(`- ${a.id} (${a.name})`);
}

function parseCommand(line) {
  const t = line.trim();
  if (!t.startsWith("/")) return null;
  const [cmd, ...args] = t.slice(1).split(/\s+/);
  return { cmd: cmd.toLowerCase(), args };
}

async function respond(agent, userText) {
  const history = state.historyByAgent[agent.id];
  const { text, history: newHistory } = await askAgent({
    model,
    agent,
    userText,
    history
  });

  state.historyByAgent[agent.id] = newHistory;
  console.log(`\n${agent.name} (${agent.id}):\n${text}\n`);
}

async function main() {
  header();

  const rl = readline.createInterface({ input, output });
  rl.setPrompt("> ");
  rl.prompt();

  rl.on("line", async (line) => {
    const cmdObj = parseCommand(line);

    try {
      if (cmdObj) {
        const { cmd, args } = cmdObj;

        if (cmd === "exit" || cmd === "quit") return rl.close();

        if (cmd === "agents") {
          listAgents();
          rl.prompt();
          return;
        }

        if (cmd === "use") {
          const id = args[0];
          if (!id) console.log("Usage: /use analyst");
          else if (!getAgentById(id)) console.log("Unknown agent. Use /agents");
          else {
            state.activeAgentId = id;
            console.log(`Active agent set to: ${id}`);
          }
          rl.prompt();
          return;
        }

        if (cmd === "all") {
          const v = (args[0] || "").toLowerCase();
          if (v === "on") state.multiAgentMode = true;
          else if (v === "off") state.multiAgentMode = false;
          else console.log("Usage: /all on | /all off");
          console.log(`Multi-agent: ${state.multiAgentMode ? "ON" : "OFF"}`);
          rl.prompt();
          return;
        }

        if (cmd === "reset") {
          for (const a of AGENTS) state.historyByAgent[a.id] = [];
          console.log("✅ Memory reset for all agents.");
          rl.prompt();
          return;
        }

        console.log("Unknown command. Try /agents, /use, /all, /reset, /exit");
        rl.prompt();
        return;
      }

      const userText = line.trim();
      if (!userText) return rl.prompt();

      if (state.multiAgentMode) {
        for (const a of AGENTS) await respond(a, userText);
      } else {
        const agent = getAgentById(state.activeAgentId);
        await respond(agent, userText);
      }

      rl.prompt();
    } catch (err) {
      console.log("\n[ERROR]", err?.message || err);
      rl.prompt();
    }
  });

  rl.on("close", () => {
    console.log("\nBye 👋");
    process.exit(0);
  });
}

main();