# 🚀 Equinox Nexus - Complete Setup Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Running the Application](#running-the-application)
4. [AI Agent Configuration](#ai-agent-configuration)
5. [Verification](#verification)

---

## Prerequisites

### Required Software
- **Node.js** 18.0.0 or higher
- **Python** 3.9 or higher
- **npm** or **yarn**
- **Git** (optional)

---

## Installation

### Step 1: Install Frontend Dependencies

```bash
npm install
```

### Step 2: Install Backend Dependencies

```bash
pip install -r backend/requirements.txt
```

---

## Running the Application

### Option 1: Frontend Only (Recommended for Demo)

```bash
npm run dev
```
Open browser: http://localhost:3000

### Option 2: Full Stack (Frontend + Backend)

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

---

## AI Agent Configuration

To enable the "Agentic Trio" (The Actuary, Fiscal Ghost, and The Nexus):

1. Get a GROQ API Key from [console.groq.com](https://console.groq.com).
2. Create a `.env.local` file in the project root.
3. Add the following line:
   ```env
   GROQ_API_KEY=gsk_your_key_here
   ```

---

## Verification

### Checklist
- [ ] Frontend loads at http://localhost:3000
- [ ] Hero dashboard is visible
- [ ] Simulation form responds to input
- [ ] Agent Swarm displays agent interactions (requires API key)

---

**🎉 You're all set! Enjoy exploring Equinox Nexus.**
