import chalk from "chalk";
import readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";

import { AGENTS } from "./agents.js";
import { parseArgs, runAgent } from "./llm.js";
import { SETTINGS } from "./settings.js";

const { theme, defaults, defaultMarking } = SETTINGS;
const { titles, help, status, errorsTitle, warnings } = SETTINGS.ui;

const argvMap = parseArgs(process.argv);

const enabledIds = defaults.enabledAgents;
const enabledAgents = AGENTS.filter(a => enabledIds.includes(a.id));

// LLM config without .env:
// - either pass via environment variable GEMINI_API_KEY
// - or via CLI: --key=...
const apiKey = process.env.GEMINI_API_KEY || argvMap.key || null;
const model = argvMap.model || SETTINGS.defaults.model;

// default: LLM off unless explicitly enabled with --llm or /llm on
let useLLM = Boolean(argvMap.llm);

// Operator state
const state = {
  task: "",
  operatorContext: "", // notes/clarifications from operator
  lastRuns: [],        // [{agentId, agentName, output}]
  picked: null         // {index, agentId, output}
};

function getLLMStatusString() {

  const llmStatus = useLLM ? status.llmOn : status.llmOff;
  const keyInfo = useLLM ? (apiKey ? labels.keyDetected : labels.mockFallback) : "";

  return `${titles.llmMode} ${llmStatus} ${keyInfo}`;
}

function printHeader() {
  console.log(theme.header(titles.welcome));
  
  //Startup Options
  console.log(theme.subtitle(titles.startupOptions));
  help.filter(item => item.cmd.startsWith('--')).forEach(item => {
    console.log(`  ${item.cmd.padEnd(18)} ${item.desc}`);
  });

  console.log("");

  //Commands
  console.log(theme.subtitle(titles.commands));
  help.filter(item => item.cmd.startsWith('/')).forEach(item => {
    console.log(`  ${item.cmd.padEnd(18)} ${item.desc}`);
  });
  console.log("");

  console.log(`${getLLMStatusString()}\n`);
}

function listAgents() {
  console.log(theme.subtitle);
  for (const a of AGENTS) {
    console.log(theme.highlight(`${defaultMarking.point} ${a.id} (${a.name})`));
    console.log(theme.info(`  ${titles.rules} ${a.instructions}`));
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
  //if the tag is NOT specified → all enabled agents respond
  if (!target) return enabledAgents;

  //if explicitly @all → also all
  if (target === "all") return enabledAgents;

  // if a specific tag is specified → we look for this agent among enabled
  const agent = enabledAgents.find(a => a.id === target);
  return agent ? [agent] : []; // if not found — empty
}

function getAgentColor(agentId) {
  const index = enabledAgents.findIndex(a => a.id === agentId);
  return SETTINGS.agentColors[index % SETTINGS.agentColors.length] || theme.defaultColor;
}

async function runAllAgents() {
  if (!state.task.trim()) {
    console.log(warnings.noTask);
    return;
  }

  console.log(titles.runnindAgents);
  console.log(`${titles.task} ${state.task}`);
  if (state.operatorContext.trim()) console.log(`${title.context} ${state.operatorContext}`);

  console.log(`${getLLMStatusString()}\n`);
  console.log(defaultMarking.separator);

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

  // const COLORS = ['green', 'yellow', 'magenta', 'blue', 'red'];
  
  // Print numbered outputs so operator can pick
  state.lastRuns.forEach((r, i) => {
    const colorFn = getAgentColor(r.agentId);
    console.log(
      `${theme.highlight(`[#${i + 1}] ${r.agentName}`)} ${theme.defaultColor(`(${r.agentId})`)}\n` +
      `${colorFn(r.output)}\n` +
      `${defaultMarking.separator}\n`
    );
  });

  console.log(`${warnings.operationAction}\n`);
}

function pickDecision(n) {
  if (!state.lastRuns.length) {
    console.log(warnings.nothingPick);
    return;
  }
  const idx = n - 1;
  if (Number.isNaN(idx) || idx < 0 || idx >= state.lastRuns.length) {
    console.log(warnings.invalidPick);
    return;
  }
  state.picked = { index: n, ...state.lastRuns[idx] };
  console.log(`${title.decisionPicked} ${defaultMarking.point}${n} (${state.picked.agentName} / ${state.picked.agentId})`);
}

function showFinal() {
  if (!state.picked) {
    console.log(warnings.noDecision);
    return;
  }
  console.log(title.decisionOperator);
  console.log(`${title.decisionPicked} ${defaultMarking.point}${state.picked.index} ${state.picked.agentName} (${state.picked.agentId})`);
  console.log(state.picked.output);
  console.log(`${defaultMarking.separator_2}\n`);
}

function toggleLLM(val) {
  if (val === "on") useLLM = true;
  else if (val === "off") useLLM = false;
  else {
    console.log(warnings.llmUsage);
    return;
  }

  console.log(`${getLLMStatusString()}\n`);
}

function refine(text) {
  if (!text.trim()) {
    console.log(warnings.refineUsage);
    return;
  }
  // append refinement so operator can iteratively steer agents
  state.operatorContext = state.operatorContext
    ? `${state.operatorContext}\n${text.trim()}`
    : text.trim();

  console.log(warnings.addedContext);
}


function getEnabledAgents() {
  return AGENTS.filter(a => enabledIds.includes(a.id));
}

async function respond(agent, userText) {
  try {
    const out = await runAgent({
      agent,
      task: userText,
      context: state.operatorContext || "",
      useLLM,
      apiKey,
      model
    });

    const colorFn = getAgentColor(agent.id);

    const headerStyle = theme?.highlight || chalk.cyan;

    console.log(headerStyle(`\n[${agent.name} (${agent.id})]`)); 
    console.log(colorFn(out) + "\n");
    
  } catch (error) {
    console.log(theme.error(`${errorsTitle.respond} ${error.message}`));
  }
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
          console.log(`${warnings.unknownAgent} ${target}`);
          rl.prompt();
          return;
        }
      
        //if you want plain text to also update state.task:
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
        if (!taskText) console.log(warnings.taskUsage);
        else {
          state.task = taskText;
          console.log(warnings.taskUpdate);
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

      console.log(warnings.command);
      rl.prompt();
    } catch (err) {
      console.log(`\n${errorsTitle.default}`, err?.message || err);
      rl.prompt();
    }
  });

  rl.on("close", () => {
    console.log(`\n${warnings.endSession}`);
    process.exit(0);
  });
}

main();