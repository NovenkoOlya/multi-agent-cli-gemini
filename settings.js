import chalk from "chalk";

export const SETTINGS = {
    appModes: {
      HUMAN: "human",
      AGENT: "agent"
   },

   storage: {
    memoryFile: "./storage/shared_memory.json",
  },

    theme: {
        header: chalk.bold.magenta,
        subtitle: chalk.yellow,
        info: chalk.blue,
        textWhite: chalk.white,
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
        separator: "---------------------------",
        separator_2: "==================================",
        point: "#",
        prompt: "> "
    },
  
    ui: {
        titles: {
          welcome: "=== Multi-Agent Environment (Operator-in-the-loop) ===",
          decisionOperator: "=== OPERATOR DECISION (current) ===",
          runnindAgents: "--- Running agents ---",
          chatSession: "--- YOUR CHAT SESSIONS ---",
          startupOptions: "Startup options:",
          commands: "Commands:",
          llmMode: "LLM mode:",
          rules: "Rules:",
          context: "Operator context:",
          decisionPicked: "Picked decision:",
          task: "Task:",
          approvedStep: "Approved Step:",
          records: "Records: "
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
          { cmd: "/chats", desc: "Show all created chats" },
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
            respond: "[ERROR in respond]:",
            parseHistory: "[ERROR] Failed to parse history:"
        },
        warnings: {
            command: "Unknown command. Use /agents, /task, /llm, /run, /pick, /refine, /final, /chats, /exit",
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
            endSession: "Session ended.",
            savedMemory: "saved to chat session",
            historyEmpty: "History file is empty.",
            noSessions: "No active sessions found in storage.",
            unknownDate: "Unknown date",
            noHistory: "No history file found yet. Run /pick to save something!"
        }
      }
  };