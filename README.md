# Multi-Agent CLI (Gemini + Mock Mode)

A Node.js command-line application that runs multiple specialized agents (Tech, Business, Legal) in an operator-in-the-loop workflow.

The app supports:
- **Interactive multi-agent mode** (default) where you can run all enabled agents, compare responses, and pick a final decision.
- **Single-agent routing** with `@agentId` messages (for example, `@tech design a REST API`).
- **Gemini-backed responses** when LLM mode is enabled and an API key is available.
- **Deterministic mock responses** when LLM mode is off or key is missing.

---

## Table of Contents
- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Start the app](#start-the-app)
  - [CLI flags](#cli-flags)
  - [Interactive commands](#interactive-commands)
  - [Direct agent targeting](#direct-agent-targeting)
  - [Typical workflow](#typical-workflow)
- [Sessions and Persistence](#sessions-and-persistence)
- [Project Structure](#project-structure)
- [Known Limitations](#known-limitations)
- [Development Notes](#development-notes)

---

## Features

- **Role-based agent system** with predefined scopes:
  - `tech` – technical/software questions.
  - `business` – product, KPIs, prioritization, analytics.
  - `legal` – privacy/compliance/legal-risk at high level.
- **Operator decision loop**:
  1. Define task.
  2. Run agents.
  3. Pick best answer.
  4. Refine context and re-run.
- **Session memory** saved to JSON storage.
- **Colorized terminal output** for readability.
- **LLM fallback strategy**:
  - If Gemini fails, the app automatically falls back to mock mode for that response.

## Architecture Overview

The project is built around four modules:

- `index.js` – CLI loop, command parsing, routing, operator flow, memory persistence.
- `agents.js` – agent definitions and role instructions.
- `llm.js` – argument parsing + response provider (Gemini or mock implementation).
- `settings.js` – UI strings, defaults, theme, storage path, enabled agents.

## Requirements

- **Node.js 18+**
- npm (bundled with Node.js)

## Installation

```bash
npm install
```

## Configuration

You can run the tool in either mode:

1. **Mock mode** (default): no API key required.
2. **Gemini mode**: provide API key via environment variable or CLI flag.

### Option A: environment variable (recommended)

```bash
export GEMINI_API_KEY="your_api_key_here"
```

### Option B: CLI flag

```bash
node index.js --llm --key=your_api_key_here
```

> Note: Avoid committing keys to source control or sharing them in command history.

## Usage

### Start the app

```bash
npm start
```

or

```bash
node index.js
```

### CLI flags

- `--llm` – enable LLM mode.
- `--key=...` – pass Gemini API key.
- `--model=...` – choose Gemini model (default: `gemini-2.5-flash`).
- `--session=<id>` – continue an existing saved session.
- `--agent=<id>` – run in agent mode context.

Example:

```bash
node index.js --llm --model=gemini-2.5-flash --session=my-session
```

### Interactive commands

- `/agents` – list available agents and roles.
- `/task <text>` – set current task.
- `/llm on|off` – toggle LLM usage at runtime.
- `/run` – run all enabled agents on current task.
- `/pick <n>` – select response number `n` as current decision.
- `/refine <text>` – add extra context/constraints.
- `/final` – show selected decision.
- `/chats` – list saved sessions.
- `/exit` – quit.

### Direct agent targeting

You can send plain messages directly:

- `@tech <message>`
- `@business <message>`
- `@legal <message>`
- `@all <message>`

If no `@target` is provided, all enabled agents are used.

### Typical workflow

1. Start app.
2. `/task Design API for user onboarding and GDPR-safe data collection`
3. `/run`
4. `/pick 1`
5. `/refine Add requirement: launch MVP in 2 weeks`
6. `/run`
7. `/final`

## Sessions and Persistence

- Chat history is stored in:
  - `./storage/shared_memory.json`
- Each session contains:
  - start time
  - list of selected decisions (`/pick` entries)
- Continue a previous session:

```bash
node index.js --session=<existing-session-id>
```

## Project Structure

```text
.
├── agents.js
├── index.js
├── llm.js
├── settings.js
├── package.json
└── storage/
    └── shared_memory.json
```

## Known Limitations

- Agent instructions are static and hardcoded.
- Enabled agents are configured in `settings.js` (`defaults.enabledAgents`).
- Current implementation has no automated tests.
- Some code paths are still rough and can be improved (validation, consistency, and error messaging).

## Development Notes

- Start in mock mode for local development.
- Use small, focused prompts for better agent outputs.
- Keep operator context concise during iterative refinement.
