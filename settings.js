import chalk from "chalk";

export const SETTINGS = {
    theme: {
        header: chalk.bold.magenta,
        subtitle: chalk.yellow,
        info: chalk.blue,
        success: chalk.green,
        error: chalk.red.bold,
        highlight: chalk.cyan,
        defaultColor: chalk.gray,
        
        agentName: (name) => chalk.black.bgCyan(` ${name} `),
      },

    // colors for displaying agents
    agentColors: [
        chalk.green,
        chalk.yellow,
        chalk.magenta,
        chalk.blue,
        chalk.cyan,
        chalk.red
      ],
    
    // // system colors
    // uiColors: {
    //   header: 'bold',
    //   error: 'red',
    //   info: 'blue',
    //   success: 'green',
    //   border: 'gray'
    // },
  
    // default settings
    defaults: {
      model: "gemini-2.5-flash",
      enabledAgents: ["tech", "business"],
    },

    defaultMarking: {
        separator: "----------------------",
        separator_2: "==================================",
        point: "#"
    },
  
    ui: {
        titles: {
          welcome: "=== Multi-Agent Environment (Operator-in-the-loop) ===",
          decisionOperator: "=== OPERATOR DECISION (current) ===",
          runnindAgents: "--- Running agents ---",
          startupOptions: "Startup options:",
          commands: "Commands:",
          llmMode: "LLM mode:",
          rules: "Rules:",
          context: "Operator context:",
          decisionPicked: "Picked decision:",
          task: "Task:"
        },
        help: [
          { cmd: "--llm", desc: "Enable Gemini mode (requires key via env or --key=...)" },
          { cmd: "--key=XXXX", desc: "Provide Gemini API key (optional; avoid sharing in repos)" },
          { cmd: "--model=...", desc: "Gemini model (default: gemini-2.5-flash)" },
          { cmd: "/agents", desc: "List agents and their roles" },
          { cmd: "/task <text>", desc: "Set current task" },
          { cmd: "/llm on|off", desc: "Toggle LLM usage (Gemini if key present; otherwise mock)" },
          { cmd: "/run", desc: "Run all agents on the task" },
          { cmd: "/pick <n>", desc: "Pick agent output #n as intermediate decision" },
          { cmd: "/refine <text>", desc: "Add operator context/constraints, then /run again" },
          { cmd: "/final", desc: "Show operator's current chosen decision" },
          { cmd: "/exit", desc: "Quit the application" }
        ],
        status: {
          llmOn: "ON",
          llmOff: "OFF",
          keyDetected: "(key detected)",
          mockFallback: "(no key → mock fallback)"
        },
        errorsTitle: {
            default: "[ERROR]",
            respond: "[ERROR in respond]:"
        },
        warnings: {
            command: "Unknown command. Use /agents, /task, /llm, /run, /pick, /refine, /final, /exit",
            llmUsage: "Usage: /llm on | /llm off",
            noDecision: "No decision picked yet. Use /pick <n> after /run.",
            invalidPick: "Invalid pick. Use /pick <n> where n is from the last run list.",
            nothingPick: "Nothing to pick. Run /run first.",
            operationAction: "Operator action: /pick <n> to choose an intermediate decision, or /refine <text> then /run again.",
            noTask: "No task set. Use /task <text> first.",
            refineUsage: "Usage: /refine <text>",
            addedContext: "Added operator context. Now run /run again.",
            taskUsage: "Usage: /task <text>",
            taskUpdate: "Task updated. Run /run.",
            unknownAgent: "Unknown or disabled agent:",
            endSession: "Session ended."
        }
      }
  };