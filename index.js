import readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import { AGENTS, getAgentById } from "./agents.js";

// ---- READ CLI ARGUMENTS ----
const args = process.argv.slice(2);

const isHuman = args.includes("--human");
const agentArg = args.find(arg => arg.startsWith("--agent="));

// ---- START MODE ----
if (!isHuman && !agentArg) {
  console.log("Please start the application with:");
  console.log("  node index.js --human");
  console.log("or");
  console.log("  node index.js --agent=analyst");
  process.exit(1);
}

// ---- AGENT MODE ----
if (agentArg) {
  const agentName = agentArg.split("=")[1];
  const agent = getAgentById(agentName);

  if (!agent) {
    console.log("Unknown agent.");
    process.exit(1);
  }

  console.log(`Starting in AGENT mode`);
  console.log(`Agent identified as: ${agent.id}`);
  console.log("Behavior rules loaded:");
  console.log(agent.instructions);
  console.log("---------------");

  // Agent logic placeholder
  console.log("Agent is now executing its role...");

  process.exit(0);
}

// ---- HUMAN MODE ----
if (isHuman) {
  console.log("Starting in HUMAN mode");
  console.log("Interactive CLI session started.");
  console.log("Type something and press Enter:");

  const rl = readline.createInterface({ input, output });

  rl.setPrompt("> ");
  rl.prompt();

  rl.on("line", (line) => {
    const text = line.trim();
    if (!text) return rl.prompt();

    console.log("You entered:", text);
    rl.prompt();
  });

  rl.on("close", () => {
    console.log("\nSession ended.");
    process.exit(0);
  });
}