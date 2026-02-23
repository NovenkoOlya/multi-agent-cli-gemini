// index.js
import chalk from "chalk";
import readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";

import { AGENTS } from "./agents.js";
import { parseArgs, runAgent } from "./llm.js";

const argvMap = parseArgs(process.argv);

const enabledIds = ["tech", "business"];
const enabledAgents = AGENTS.filter(a => enabledIds.includes(a.id));

// LLM config without .env:
// - either pass via environment variable GEMINI_API_KEY
// - or via CLI: --key=...
const apiKey = process.env.GEMINI_API_KEY || argvMap.key || null;
const model = argvMap.model || "gemini-2.5-flash";

// default: LLM off unless explicitly enabled with --llm or /llm on
let useLLM = Boolean(argvMap.llm);

// Operator state
const state = {
  task: "",
  operatorContext: "", // notes/clarifications from operator
  lastRuns: [],        // [{agentId, agentName, output}]
  picked: null         // {index, agentId, output}
};

function printHeader() {
  console.log("=== Multi-Agent Environment (Operator-in-the-loop) ===");
  console.log("This CLI runs multiple agents on the same task and lets the operator choose.");
  console.log("");
  console.log("Startup options:");
  console.log("  --llm              Enable Gemini mode (requires key via env or --key=...)");
  console.log("  --key=XXXX         Provide Gemini API key (optional; avoid sharing in repos)");
  console.log("  --model=...        Gemini model (default: gemini-2.5-flash)");
  console.log("");
  console.log("Commands:");
  console.log("  /agents            List agents and their roles");
  console.log("  /task <text>       Set current task");
  console.log("  /llm on|off        Toggle LLM usage (Gemini if key present; otherwise mock)");
  console.log("  /run               Run all agents on the task");
  console.log("  /pick <n>          Pick agent output #n as intermediate decision");
  console.log("  /refine <text>     Add operator context/constraints, then /run again");
  console.log("  /final             Show operator's current chosen decision");
  console.log("  /exit              Quit");
  console.log("");
  console.log(`LLM mode: ${useLLM ? "ON" : "OFF"} ${useLLM ? (apiKey ? "(key detected)" : "(no key → mock fallback)") : ""}`);
  console.log("");
}

function listAgents() {
  console.log("Agents:");
  for (const a of AGENTS) {
    console.log(chalk.cyan(`- ${a.id} (${a.name})`));
    console.log(chalk.green(`  Rules: ${a.instructions}`));
  }
}

function parseCommand(line) {
  const t = line.trim();
  if (!t.startsWith("/")) return null;
  const [cmd, ...args] = t.slice(1).split(/\s+/);
  return { cmd: cmd.toLowerCase(), args, rawArgsText: t.slice(1 + cmd.length).trim() };
}

function parseTarget(line) {
  const m = line.trim().match(/^@(\w+)\s+(.*)$/);
  if (!m) return { target: null, text: line.trim() };
  return { target: m[1].toLowerCase(), text: m[2].trim() };
}

function resolveAgentsToRun(target, enabledAgents) {
  // ✅ якщо тег НЕ вказаний → відповідають всі enabled агенти
  if (!target) return enabledAgents;

  // ✅ якщо явно @all → теж всі
  if (target === "all") return enabledAgents;

  // ✅ якщо вказаний конкретний тег → шукаємо цього агента серед enabled
  const agent = enabledAgents.find(a => a.id === target);
  return agent ? [agent] : []; // якщо не знайдено — пусто
}

async function runAllAgents() {
  if (!state.task.trim()) {
    console.log("No task set. Use /task <text> first.");
    return;
  }

  console.log("\n--- Running agents ---");
  console.log(`Task: ${state.task}`);
  if (state.operatorContext.trim()) console.log(`Operator context: ${state.operatorContext}`);
  console.log(`LLM: ${useLLM ? "ON" : "OFF"} ${useLLM && !apiKey ? "(no key → mock fallback)" : ""}`);
  console.log("----------------------\n");

  state.lastRuns = [];

  for (const agent  of enabledAgents) {
    const out = await runAgent({
      agent,
      task: state.task,
      context: state.operatorContext,
      useLLM,
      apiKey,
      model
    });

    state.lastRuns.push({ agentId: agent.id, agentName: agent.name, output: out });
  }

  const COLORS = ['green', 'yellow', 'magenta', 'blue', 'red'];
  
  // Print numbered outputs so operator can pick
  state.lastRuns.forEach((r, i) => {
    const color = COLORS[i % COLORS.length];
    console.log(
      `${chalk.cyan(`[#${i + 1}] ${r.agentName}`)} ${chalk.gray(`(${r.agentId})`)}\n` +
      `${chalk[color](r.output)}\n` +
      `${chalk.blue("----------------------")}\n`
    );
  });

  console.log("Operator action: /pick <n> to choose an intermediate decision, or /refine <text> then /run again.\n");
}

function pickDecision(n) {
  if (!state.lastRuns.length) {
    console.log("Nothing to pick. Run /run first.");
    return;
  }
  const idx = n - 1;
  if (Number.isNaN(idx) || idx < 0 || idx >= state.lastRuns.length) {
    console.log("Invalid pick. Use /pick <n> where n is from the last run list.");
    return;
  }
  state.picked = { index: n, ...state.lastRuns[idx] };
  console.log(`Picked decision: #${n} (${state.picked.agentName} / ${state.picked.agentId})`);
}

function showFinal() {
  if (!state.picked) {
    console.log("No decision picked yet. Use /pick <n> after /run.");
    return;
  }
  console.log("\n=== OPERATOR DECISION (current) ===");
  console.log(`Picked: #${state.picked.index} ${state.picked.agentName} (${state.picked.agentId})`);
  console.log(state.picked.output);
  console.log("==================================\n");
}

function toggleLLM(val) {
  if (val === "on") useLLM = true;
  else if (val === "off") useLLM = false;
  else {
    console.log("Usage: /llm on | /llm off");
    return;
  }
  console.log(`LLM mode: ${useLLM ? "ON" : "OFF"} ${useLLM ? (apiKey ? "(key detected)" : "(no key → mock fallback)") : ""}`);
}

function refine(text) {
  if (!text.trim()) {
    console.log("Usage: /refine <text>");
    return;
  }
  // append refinement so operator can iteratively steer agents
  state.operatorContext = state.operatorContext
    ? `${state.operatorContext}\n${text.trim()}`
    : text.trim();

  console.log("Added operator context. Now run /run again.");
}


function getEnabledAgents() {
  return AGENTS.filter(a => enabledIds.includes(a.id));
}



async function respond(agent, userText) {
  const out = await runAgent({
    agent,
    task: userText,
    context: state.operatorContext || "",
    useLLM,
    apiKey,
    model
  });

  const color = COLORS[index % COLORS.length];

  console.log(chalk.cyan(`\n[${agent.name} (${agent.id})]`)); 
  console.log(chalk[color](out) + "\n");
}

async function main() {
  printHeader();

  const rl = readline.createInterface({ input, output });
  rl.setPrompt("> ");
  rl.prompt();

  rl.on("line", async (line) => {
    const cmdObj = parseCommand(line);

    try {
      if (!cmdObj) {
        const { target, text } = parseTarget(line);
        if (!text) { rl.prompt(); return; }

        const enabledAgents = getEnabledAgents();
        const agentsToRun = resolveAgentsToRun(target, enabledAgents);
      
        if (target && agentsToRun.length === 0) {
          console.log(`Unknown or disabled agent: ${target}`);
          rl.prompt();
          return;
        }
      
        // ✅ якщо хочеш, щоб plain text також оновлював state.task:
        state.task = text;
      
        for (const agent of agentsToRun) {
          await respond(agent, text);
        }
      
        rl.prompt();
        return;
      }

      const { cmd, args, rawArgsText } = cmdObj;

      if (cmd === "exit" || cmd === "quit") return rl.close();

      if (cmd === "agents") {
        listAgents();
        rl.prompt();
        return;
      }

      if (cmd === "task") {
        const taskText = rawArgsText;
        if (!taskText) console.log("Usage: /task <text>");
        else {
          state.task = taskText;
          console.log("Task updated. Run /run.");
        }
        rl.prompt();
        return;
      }

      if (cmd === "llm") {
        toggleLLM((args[0] || "").toLowerCase());
        rl.prompt();
        return;
      }

      if (cmd === "run") {
        await runAllAgents();
        rl.prompt();
        return;
      }

      if (cmd === "pick") {
        const n = Number(args[0]);
        pickDecision(n);
        rl.prompt();
        return;
      }

      if (cmd === "refine") {
        refine(rawArgsText);
        rl.prompt();
        return;
      }

      if (cmd === "final") {
        showFinal();
        rl.prompt();
        return;
      }

      console.log("Unknown command. Use /agents, /task, /llm, /run, /pick, /refine, /final, /exit");
      rl.prompt();
    } catch (err) {
      console.log("\n[ERROR]", err?.message || err);
      rl.prompt();
    }
  });

  rl.on("close", () => {
    console.log("\nSession ended.");
    process.exit(0);
  });
}

main();