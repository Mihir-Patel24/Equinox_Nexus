# 🚀 Equinox Nexus - Complete Setup Guide

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **Git**

---

## 📦 Installation Steps

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd EQUINOX-FLOW
```

### 2. Frontend Setup (Next.js)

```bash
# Install dependencies
npm install

# Create environment file
copy .env.local.example .env.local
```

### 3. Backend Setup (Python)

```bash
# Navigate to backend
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Or for core backend
cd ../core
pip install -r requirements.txt
```

---

## 🔑 GROQ API Setup (IMPORTANT)

The AI agents use GROQ API for LLM inference. Follow these steps:

### Step 1: Get Your GROQ API Key

1. Visit [https://console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Navigate to **API Keys** section
4. Click **Create API Key**
5. Copy your API key (starts with `gsk_...`)

### Step 2: Add API Key to Environment

Open `.env.local` file and add:

```env
GROQ_API_KEY=gsk_your_actual_api_key_here
```

---

## 🎯 Running the Application

### Option 1: Frontend Only (Recommended for Quick Start)

```bash
# From project root
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Option 2: Full Stack (Frontend + Backend)

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Python Backend:**
```bash
cd core
python main.py
```

**Terminal 3 - FastAPI Backend (Optional):**
```bash
cd backend
uvicorn main:app --reload
```

---

## 📁 Project Structure

```
EQUINOX-FLOW/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── agents/        # Agent endpoints (uses GROQ)
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main dashboard
├── components/            # React components
│   ├── AgentSwarm.tsx     # Multi-agent debates
│   ├── SimulationForm.tsx # Input form
│   └── ...                # Other components
├── backend/               # FastAPI backend
│   ├── agents/            # Agent implementations
│   └── main.py            # FastAPI server
├── core/                  # Python core logic
│   ├── agents/            # LangGraph agents
│   └── main.py            # Core backend
├── .env.local             # Environment variables (CREATE THIS)
├── package.json           # Node dependencies
└── README.md              # This file
```

---

## 🔧 Configuration Files

### `.env.local` (Required)

Create this file in the project root:

```env
# GROQ API for AI Agents
GROQ_API_KEY=gsk_your_api_key_here

# Optional: Other API keys
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### `requirements.txt` (Backend)

Already included in `backend/` and `core/` directories:

```txt
fastapi
uvicorn
langgraph
langchain
python-dotenv
requests
```

---

## 🤖 AI Agent Features (Requires GROQ API)

### The Agentic Trio

1. **The Actuary** (Risk Agent)
   - Analyzes health, safety, quality of life

2. **Fiscal Ghost** (Expense Agent)
   - Tracks cost of living and expenses

3. **The Nexus** (Compliance Agent)
   - Tax optimization and compliance

---

## 🐛 Troubleshooting

### Issue: "GROQ API key not configured"

**Solution:**
1. Check `.env.local` exists in project root
2. Verify API key starts with `gsk_`
3. Restart the dev server: `npm run dev`

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Kill the process
npx kill-port 3000

# Or use a different port
npm run dev -- -p 3001
```

---

## 🚀 Deployment

### Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# GROQ_API_KEY=your_key_here
```

---

## ✅ Checklist

- [ ] Node.js and Python installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` created with GROQ API key
- [ ] Frontend running (`npm run dev`)
- [ ] Can access [http://localhost:3000](http://localhost:3000)

---

**🎉 You're all set! The app is now running with AI agents powered by GROQ.**
