# AI Agents CLI Chat (Gemini / Google AI Studio)

Multi-agent CLI чат (людина ↔ кілька агентів-ролей) на Node.js з реальним Gemini API.

## Setup
1) Node.js 18+
2) Create `.env` from `.env.example` and set `GEMINI_API_KEY`

## Run
npm install
npm start

## Commands
/agents
/use analyst
/all on
/all off
/reset
/exit

## Architecture
- index.js — CLI + routing + state
- agents.js — roles (agents) with different system instructions
- llm.js — single integration point with Gemini API via @google/genai
- Each agent has separate conversation memory (historyByAgent)