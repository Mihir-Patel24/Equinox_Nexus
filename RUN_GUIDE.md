# 🚀 Equinox Nexus — Running the Application

## 📦 Step 1: Install Dependencies

### Frontend (Next.js)
```powershell
# Run from the project root: EQUINOX-FLOW/
npm install
```

### Backend (Python FastAPI)
```powershell
# Run from the project root: EQUINOX-FLOW/
cd core
pip install -r requirements.txt
```

> **Note:** `prophet` requires a C++ compiler on Windows. If it fails:
> ```powershell
> pip install pystan==2.19.1.1
> pip install prophet
> ```

---

## ⚙️ Step 2: Configure Secrets

Create a `.env` file inside the `core/` folder (copy from the example):

```powershell
Copy-Item core\.env.example core\.env
```

Then open `core\.env` and set your Groq API key (free at [console.groq.com/keys](https://console.groq.com/keys)):

```env
GROQ_API_KEY=your_groq_api_key_here
```

The other settings can be left as defaults for local development.

---

## 🌐 Step 3: Run the Application

### Option A: One-Command Start (Recommended)

```powershell
# Run from the project root
.\run.ps1
```

This starts both frontend and backend together with port checking and graceful Ctrl+C cleanup.

---

### Option B: Manual Start (Two Terminals)

**Terminal 1 — Backend (FastAPI):**
```powershell
cd core
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend (Next.js):**
```powershell
npm run dev
```

---

## 🌍 Access the App

| Service | URL |
|---|---|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8000 |
| **API Docs (Swagger)** | http://localhost:8000/docs |
| **Health Check** | http://localhost:8000/health |

---

## 🧪 Run Tests

```powershell
cd core
python -m pytest tests/test_integration.py -v
```

110 tests covering all API endpoints, agents, twin persistence, RAG, and the evaluation framework.

---

## 🐛 Troubleshooting

### Backend won't start — `ModuleNotFoundError`
Make sure you installed dependencies **inside** `core/`:
```powershell
cd core
pip install -r requirements.txt
```

### `GROQ_API_KEY not set` warning
Ensure `core\.env` exists and contains your Groq key. The Decision Intelligence agent will be skipped gracefully without it, but you'll get a lower viability score.

### Port 3000 already in use
```powershell
npm run dev -- -p 3001
```

### Port 8000 already in use
```powershell
uvicorn main:app --reload --port 8001
```
Then update `NEXT_PUBLIC_API_URL=http://localhost:8001` in `.env.local`.

### ChromaDB index error on first run
Delete the stale index and let it rebuild:
```powershell
Remove-Item -Recurse -Force core\rag\chroma_db
Remove-Item -Force core\rag\kb_index.hash
```
Then restart the backend — it will re-index all 26 countries automatically.

### `uvicorn` not found
```powershell
pip install uvicorn[standard]
```

---

## 🐳 Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full Docker-based production deploy guide.

```powershell
# One command — builds and starts all 4 containers
.\deploy.ps1
```
