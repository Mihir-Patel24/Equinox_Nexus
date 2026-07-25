# Equinox Nexus 🌍

**The world's first Autonomous Agentic Financial Digital Twin for global workforce mobility.**

Equinox Nexus is a production-grade, multi-agent AI system built using **FastAPI**, **LangGraph**, and **Next.js**. It constructs a persistent **Financial Digital Twin** of an individual or workforce and projects long-term financial, lifestyle, and regulatory outcomes across jurisdictions using machine learning, Monte Carlo methods, and RAG.

---

## 🏗️ Technical Architecture

Equinox Nexus employs a parallel multi-agent graph orchestrated via **LangGraph**. The system fetches real-time data, processes it through specialized domain agents, and aggregates the outputs with Explainable AI (XAI) feature decomposition.

### System Data Flow

```mermaid
graph TD
    User([User Request]) --> SSE[FastAPI SSE Router /simulate/stream]
    SSE --> Graph[LangGraph Agent Graph]
    
    subgraph Parallel Stage (ThreadPoolExecutor)
        Graph --> Actuary[🕵️ Actuary Agent]
        Graph --> Fiscal[👻 Fiscal Ghost Agent]
        Graph --> Nexus[⚖️ The Nexus RAG]
    end
    
    Actuary --> AQI[Live Open-Meteo AQI + Safety Indicators]
    Fiscal --> BehaviourModel[XGBoost Behaviour Model R²=0.999]
    Nexus --> VectorDB[ChromaDB Vector Index / 26 countries]
    
    Parallel_Done{Merge Partial State}
    AQI --> Parallel_Done
    BehaviourModel --> Parallel_Done
    VectorDB --> Parallel_Done
    
    Parallel_Done --> Chronos[⏳ Chronos Projection Agent]
    Chronos --> MC[1000-Path Monte Carlo GBM Simulation]
    Chronos --> Prophet[Prophet FX Drift Forecast]
    
    MC --> DI[💼 Decision Intelligence Groq llama-3.3-70b]
    Prophet --> DI
    
    DI --> Aggregator[📊 Aggregator + Explainable AI]
    Aggregator --> Output([Real-Time SSE Update & Final Twin Storage])
```

---

## 🤖 The Multi-Agent Swarm

| Agent | Technology | Responsibility |
| :--- | :--- | :--- |
| **🕵️ The Actuary** | `httpx` + Open-Meteo API | Risk & QoL. Computes safety index, healthcare access, and real-time Air Quality Indexes (AQI). |
| **👻 Fiscal Ghost** | `scikit-learn` XGBoost Regressor | Lifestyle-scaled expense projection. Evaluates custom consumption parameters against a database of 10,000 synthetic consumer profiles. |
| **⚖️ The Nexus** | `ChromaDB` + `sentence-transformers` | Retrieval-Augmented Generation (RAG) querying 52 text chunks across 26 countries to evaluate tax brackets, double taxation avoidance (DTA) treaties, and visas. |
| **⏳ The Chronos** | Geometric Brownian Motion + Prophet | 5-Year wealth trajectory forecaster. Simulates 1,000 stochastic paths with Prophet currency drift modeling. |
| **💼 Payroll Intel** | `scikit-learn` Isolation Forest | Outlier detection and anomaly scanning for corporate payroll datasets (up to 10k items per batch). |
| **🔎 Research Agent** | OECD + World Bank + IMF APIs | Autonomous background scraper with a 7-day cache gate that auto-updates and re-indexes the RAG vector database. |

---

## 🔬 Mathematical Formulations

### Stochastic Wealth Projection (GBM)
The Chronos agent models wealth trajectories using Geometric Brownian Motion (GBM) with deterministic currency drift:

$$dS_t = \mu S_t dt + \sigma S_t dW_t$$

Where:
- $S_t$ is the user's projected wealth.
- $\mu$ is the drift coefficient, dynamically loaded from the **Prophet FX forecast model** ($52$-week trend horizon).
- $\sigma$ is the historical volatility of the target currency.
- $dW_t$ is the Wiener process increment (normal distribution random walk).

---

## ⚡ Hackathon Live Demo Highlight: Real-Time SSE Streaming

Instead of standard blocking REST APIs, Equinox Nexus implements a **Server-Sent Events (SSE) streaming architecture** on the `/simulate/stream` route.
As the LangGraph execution tree executes:
1. **Pipeline Start:** Backend starts LangGraph thread initialization.
2. **Parallel Agent Execution:** Actuary, Fiscal Ghost, and Nexus RAG trigger simultaneously.
3. **Chronos Activation:** Monte Carlo simulation is computed.
4. **Decision Intelligence:** Groq LLM synthesizes reasoning.
5. **Completion:** The final JSON state is saved to the SQLite/PostgreSQL **Twin Store** and returned.

The React frontend hooks into the SSE stream, rendering live progress logs and status ticks on the **Agent Swarm Loading Panel** in real time.

---

## 🚀 One-Command Quickstart

To run the entire platform locally, make sure you have python 3.11+ and node.js installed.

1. **Clone the Repository & Navigate**
   ```powershell
   git clone <repo-url>
   cd EQUINOX-FLOW
   ```

2. **Configure your Credentials**
   Create a `.env` file in the `core/` folder (or edit `core/.env.example`):
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   API_KEY_ENABLED=false
   ```

3. **Start Frontend & Backend with One Command**
   We have provided a comprehensive startup script that handles port checking, environment validation, background processes, and graceful Ctrl+C cleanup:
   ```powershell
   .\run.ps1
   ```

---
© 2026 Equinox Nexus • Simulated and Orchestrated by Multi-Agent AI
