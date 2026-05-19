<div align="center">

# 🤖 Multi-Agent Research Intelligence System

**Transform any topic into a boardroom-ready Corporate Intelligence Briefing in under 60 seconds.**  
Three specialized CrewAI agents collaborate in real-time — searching the web, synthesizing data, and writing executive-grade markdown reports — all streamed live to a stunning Next.js interface.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Shriyanshu2004/Multi-Agent-Workflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![CrewAI](https://img.shields.io/badge/CrewAI-1.14-purple)](https://crewai.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green?logo=fastapi)](https://fastapi.tiangolo.com)

</div>

---

## 📸 Demo

> Enter a topic like *"AI in Healthcare 2025"* → watch 3 agents activate sequentially → receive a full structured briefing with trends table, strategic implications, risk factors, and sources.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🕵️ **Agent 1 — Web Scraper** | Uses Serper/Google to find 8–12 recent, credible data points |
| 🧠 **Agent 2 — Synthesizer** | Cross-references facts, extracts trends, assigns confidence levels |
| ✍️ **Agent 3 — Executive Writer** | Produces a structured Markdown briefing with tables & sections |
| ⚡ **Live SSE Streaming** | Real-time agent progress streamed via Server-Sent Events |
| 📋 **Rich Markdown Output** | GFM tables, syntax-highlighted code, copy + download buttons |
| 🌙 **Dark Glassmorphism UI** | Animated gradient backgrounds, glass cards, micro-animations |
| 🆓 **Free LLM via Groq** | Powered by Llama 3.1 8B on Groq — no credit card required |

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    User(["👤 User Browser\n(Next.js 14)"])
    Form["📝 Research Form\nTopic Input"]
    Route["🔀 Next.js API Route\n/api/research"]
    FastAPI["⚡ FastAPI Backend\n/api/research (SSE)"]

    subgraph CrewAI Pipeline [" 🤖 CrewAI Sequential Pipeline "]
        A1["🕵️ Agent 1\nWeb Intelligence Gatherer\n(SerperDevTool)"]
        A2["🧠 Agent 2\nData Synthesizer\n(Analysis only)"]
        A3["✍️ Agent 3\nExecutive Writer\n(Markdown output)"]
        A1 -->|Raw findings| A2
        A2 -->|Structured insights| A3
    end

    Serper["🔍 Serper API\n(Google Search)"]
    Groq["🦙 Groq API\n(Llama 3.1 8B Instant)"]
    Report["📊 Markdown Briefing\n(Rendered in browser)"]

    User --> Form --> Route --> FastAPI
    FastAPI --> A1
    A1 <-->|Search queries| Serper
    A1 & A2 & A3 <-->|LLM calls| Groq
    A3 -->|SSE: complete event| FastAPI
    FastAPI -->|SSE stream| Route
    Route -->|SSE stream| User
    User --> Report
```

---

## 📁 Project Structure

```
multi-agent-research-system/
├── frontend/                    # Next.js 14 App Router
│   ├── app/
│   │   ├── api/research/        # SSE proxy route handler
│   │   │   └── route.ts
│   │   ├── globals.css          # Glassmorphism + markdown styles
│   │   ├── layout.tsx           # Root layout + SEO metadata
│   │   └── page.tsx             # Main UI with SSE client logic
│   ├── components/
│   │   ├── ResearchForm.tsx     # Topic input with example chips
│   │   ├── AgentStatusPanel.tsx # Live agent progress cards
│   │   └── MarkdownReport.tsx   # Report renderer + copy/download
│   ├── lib/
│   │   └── types.ts             # TypeScript types for SSE events
│   ├── package.json
│   ├── tailwind.config.ts
│   └── next.config.mjs
│
├── backend/                     # FastAPI + CrewAI
│   ├── main.py                  # FastAPI app + SSE endpoint
│   ├── agents.py                # 3 CrewAI agent definitions
│   ├── tasks.py                 # Task descriptions + context chaining
│   ├── tools.py                 # SerperDevTool wrapper
│   ├── crew.py                  # Crew assembly + async stream generator
│   ├── requirements.txt
│   ├── .env.example             # Environment variable template
│   └── .env                     # Your local secrets (git-ignored)
│
├── package.json                 # Root — runs both servers via concurrently
├── start-backend.cmd            # Windows helper script for backend startup
├── vercel.json                  # Monorepo routing config
├── .gitignore
└── README.md
```

---

## ⚙️ Local Setup Guide

### Prerequisites

- **Node.js** ≥ 18.x ([download](https://nodejs.org))
- **Python** 3.10–3.13 ([download](https://python.org)) — **Python 3.14 is not supported yet**
- **API Keys**:
  - `GROQ_API_KEY` — [console.groq.com](https://console.groq.com) (free, no credit card)
  - `SERPER_API_KEY` — [serper.dev](https://serper.dev) (free tier: 2,500 searches/month)

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Shriyanshu2004/Multi-Agent-Workflow.git
cd Multi-Agent-Workflow
```

### Step 2 — Set Up the Python Backend

```bash
cd backend

# Create virtual environment with Python 3.13
# Windows:
py -3.13 -m venv .venv313
.venv313\Scripts\pip install -r requirements.txt

# macOS/Linux:
python3.13 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Open .env and fill in your API keys:
#   GROQ_API_KEY=gsk_...
#   SERPER_API_KEY=...
```

### Step 3 — Install Root Dependencies

```bash
# From the project root
cd ..
npm install
```

### Step 4 — Run Both Servers (Single Command)

```bash
# From the project root — starts backend + frontend together
npm run dev
```

Or run them separately:

```bash
# Terminal 1 — Backend (from /backend)
# Windows:
.venv313\Scripts\python.exe main.py
# macOS/Linux:
.venv/bin/python main.py
# → Running on http://localhost:8000

# Terminal 2 — Frontend (from /frontend)
npm run dev
# → Running on http://localhost:3000
```

### Step 5 — Use the App

1. Open [http://localhost:3000](http://localhost:3000)
2. Type a research topic (e.g., *"Generative AI in Finance 2025"*)
3. Click **Generate Briefing**
4. Watch the 3 agents activate in real-time
5. Read, copy, or download your Corporate Intelligence Briefing 🎉

---

## 🔑 Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Required | Description | Where to get |
|----------|----------|-------------|--------------|
| `GROQ_API_KEY` | ✅ | Groq API key | [console.groq.com](https://console.groq.com) |
| `SERPER_API_KEY` | ✅ | Serper (Google Search) key | [serper.dev](https://serper.dev) |
| `LLM_MODEL_NAME` | ⚙️ | LLM model (default: `groq/llama-3.1-8b-instant`) | — |
| `ALLOWED_ORIGINS` | ⚙️ | CORS origins | `http://localhost:3000` |
| `BACKEND_PORT` | ⚙️ | Backend port (default: `8000`) | — |

---

## 🚀 Deploying to Vercel

### Option A — One-Click (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Shriyanshu2004/Multi-Agent-Workflow)

### Option B — Manual Deployment

```bash
npm i -g vercel
vercel

# Set environment variables:
vercel env add GROQ_API_KEY
vercel env add SERPER_API_KEY
vercel env add NEXT_PUBLIC_BACKEND_URL   # your Vercel deployment URL
vercel env add ALLOWED_ORIGINS           # your Vercel deployment URL

vercel --prod
```

---

## 🧠 Agent Deep-Dive

### Agent 1 — Web Intelligence Gatherer 🕵️

| Property | Value |
|----------|-------|
| **Role** | Senior Research Analyst |
| **Tool** | `SerperDevTool` (Google Search) |
| **Goal** | Gather 8–12 credible data points with sources and recency |
| **Max Iterations** | 5 |

### Agent 2 — Data Synthesizer 🧠

| Property | Value |
|----------|-------|
| **Role** | Intelligence Analyst |
| **Tool** | None (pure reasoning on Task 1 output) |
| **Goal** | Extract 5–7 trends, validate cross-references, assign confidence levels |

### Agent 3 — Executive Writer ✍️

| Property | Value |
|----------|-------|
| **Role** | Corporate Communications Director |
| **Tool** | None (pure generation from Task 2 output) |
| **Goal** | Produce 8-section Markdown briefing with tables, headers, and sources |

---

## 🔮 Future Scope

### 🔧 Short-Term
- [ ] **Persistent History** — Store past briefings in PostgreSQL/Supabase
- [ ] **PDF Export** — Server-side PDF generation
- [ ] **Topic Presets** — Industry-specific prompt templates

### 🚀 Medium-Term
- [ ] **Parallel Agent Execution** — Hierarchical process with Manager LLM
- [ ] **Custom Tool Registry** — Plug in Tavily, Exa.ai, Brave Search
- [ ] **Source Citation Links** — Hyperlink every claim to its source URL

### 🌟 Long-Term
- [ ] **Multi-Language Output** — Briefings in French, German, Japanese
- [ ] **Slack / Teams Integration** — Webhook delivery to workspace channels
- [ ] **Streaming Token Display** — Character-by-character output as Agent 3 writes

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS 3 + Custom CSS |
| Markdown Rendering | react-markdown + remark-gfm + rehype-highlight |
| SSE Client | eventsource-parser |
| Agent Orchestration | CrewAI 1.14 |
| Backend Framework | FastAPI 0.111 |
| LLM Provider | Groq (Llama 3.1 8B Instant) — free tier |
| Search Tool | Serper API (SerperDevTool) |
| Streaming | Server-Sent Events (SSE) |
| Deployment | Vercel (Node + Python runtimes) |

---

## 📄 License

MIT © [Shriyanshu2004](https://github.com/Shriyanshu2004)

---

<div align="center">
  <sub>Built with ❤️ using CrewAI, Next.js, FastAPI, and Groq</sub>
</div>
