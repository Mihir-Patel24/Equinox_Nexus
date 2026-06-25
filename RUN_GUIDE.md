# 🚀 Equinox Nexus - Running the Application

## 📦 Step 1: Install Dependencies

### Frontend (Next.js)
```bash
npm install
```

### Backend (Python FastAPI)
```bash
cd backend
pip install -r requirements.txt
cd ..
```

---

## 🌐 Step 2: Run the Application

### Option A: Frontend Only (Recommended for Demo)
```bash
npm run dev
```
Open browser: **http://localhost:3000**

### Option B: Full Stack (Frontend + Backend)

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

## 🔧 Step 3: Configure AI Agents

To enable full AI agent functionality:

1. Create a `.env.local` file in the root directory.
2. Add your GROQ API key:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```
3. Restart the development server.

---

## 📁 Project Structure

```
EQUINOX-FLOW/
├── app/                    # Next.js app directory
├── components/            # React components
├── backend/               # FastAPI backend
├── core/                  # Python core logic
└── README.md              # Project overview
```

---

## 🐛 Troubleshooting

### Issue: "GROQ API key not configured"
Verify that `.env.local` exists in the project root and contains `GROQ_API_KEY`.

### Issue: "Port 3000 already in use"
Use a different port: `npm run dev -- -p 3001` or kill the existing process.
