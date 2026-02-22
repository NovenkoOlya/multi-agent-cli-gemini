# CLI Agent System

This is a simple CLI-based application that supports two startup modes:
- Human mode
- Agent mode

## Requirements
- Node.js 18+

## How to Run

### Human mode

node index.js --human

Starts an interactive CLI session for a human user.

---

### Agent mode

node index.js --agent=legal

Starts the application as a specific agent.
The agent identifies itself and loads its behavior rules immediately.

---

## Concept

The application supports different startup keys:

- `--human` → interactive user session
- `--agent=<agentId>` → agent startup mode

In agent mode:
- The system identifies the agent via CLI argument
- Loads its behavior rules
- Executes in the context of that agent