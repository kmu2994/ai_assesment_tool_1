# 🎓 AI Inclusive Assessment System

An AI-powered, accessible examination platform with adaptive testing, semantic grading, and full accessibility support.

---

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

| Software | Version | Download Link |
|----------|---------|---------------|
| **Python** | 3.10 - 3.12 | [python.org](https://www.python.org/downloads/) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **MongoDB** | 6.0+ | [mongodb.com](https://www.mongodb.com/try/download/community) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

> ⚠️ **Note**: Ensure MongoDB is running on your local machine at `mongodb://localhost:27017` (default).

---

## 🚀 Step-by-Step Setup Guide

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-repo/ai-inclusive-assessment.git
cd ai-inclusive-assessment
```

---

### Step 2: Backend Setup

#### 2.1 Navigate to backend folder
```bash
cd backend
```

#### 2.2 Create a virtual environment
```bash
# Windows
python -m venv venv

# Mac/Linux
python3 -m venv venv
```

#### 2.3 Activate the virtual environment
```bash
# Windows (Command Prompt)
venv\Scripts\activate

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Mac/Linux
source venv/bin/activate
```

#### 2.4 Install Python dependencies
```bash
pip install -r requirements.txt
```

#### 2.5 Configure Environment Variables
Create a `.env` file in the `backend` directory (optional if using defaults):
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=ai_assessment
SECRET_KEY=your-super-secret-key-change-in-production
NVIDIA_API_KEY=your_nvidia_nim_key_here
```

#### 2.6 Initialize the database with sample data
```bash
python seed_db.py
```

This creates:
- Admin user: `admin` / `admin123`
- Teacher user: `teacher` / `teacher123`
- Student user: `student` / `student123`
- Sample exam with automated questions

#### 2.7 Start the backend server
```bash
python -m uvicorn app.main:app --reload --port 8000
```

✅ Backend should now be running at: **http://127.0.0.1:8000**
API Docs: **http://127.0.0.1:8000/docs**

---

### Step 3: Frontend Setup

#### 3.1 Open a NEW terminal window and navigate to frontend folder
```bash
cd frontend
```

#### 3.2 Install Node.js dependencies
```bash
npm install
```

#### 3.3 Start the development server
```bash
npm run dev
```

✅ Frontend should now be running at: **http://localhost:3000**

---

## 🐳 Running with Docker

You can use Docker Compose to start the entire system (Backend + Database) in one command:

```bash
docker-compose up --build
```

*Note: If MongoDB is not part of the compose file, ensure the backend container can reach your MongoDB instance.*

---

## 🎯 Access the Application

Open your browser and go to: **http://localhost:3000**

### Test Accounts:

| Role | Username | Password | What they can do |
|------|----------|----------|------------------|
| **Admin** | `admin` | `admin123` | Manage users, view system stats |
| **Teacher** | `teacher` | `teacher123` | Create exams, view student results |
| **Student** | `student` | `student123` | Take exams, view history |

---

## 📁 Project Structure

```
ai-inclusive-assessment/
├── backend/                 # FastAPI Backend (Python)
│   ├── app/
│   │   ├── api/            # Routes (Auth, Exams, Analytics, Riva)
│   │   ├── agents/         # AI Logic (Semantic Grader, OCR, Riva)
│   │   ├── core/           # Security, Config
│   │   └── db/             # MongoDB Models (Beanie ODM)
│   ├── requirements.txt    # Python deps
│   └── seed_db.py          # Database seeder
│
├── frontend/               # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/     # UI Components (Radix UI + Lucide)
│   │   ├── pages/          # Full Page Layouts
│   │   ├── lib/            # API Client (Axios)
│   │   └── hooks/          # Custom React Hooks
│   ├── package.json        # Node deps
│   └── vite.config.ts      # Proxy & Port Config (3000)
│
└── docker-compose.yml      # Container orchestration
```

---

## 🔧 Troubleshooting

### Problem: "Could not connect to MongoDB"
- Ensure MongoDB service is started: `services.msc` on Windows or `sudo systemctl start mongod` on Linux.
- Check connection string in `.env`.

### Problem: Frontend cannot talk to Backend
- Ensure Backend is running on port 8000.
- Check Vite proxy in `vite.config.ts` (proxies `/api` to `localhost:8000`).

### Problem: Port 3000 already in use (Frontend)
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Problem: Reseed Database
```bash
cd backend
python seed_db.py
```

---

## 🛠️ Common Commands Reference

| Task | Command |
|------|---------|
| Start Backend | `uvicorn app.main:app --reload` |
| Start Frontend | `npm run dev` |
| Seed Database | `python seed_db.py` |
| Docker Build | `docker-compose up --build` |

---

## ✨ Key Features

- 🧠 **Adaptive Testing** - Questions adjust difficulty based on student performance.
- 🖋️ **Semantic Grading** - AI-powered grading for descriptive answers (similarity checking).
- 🎙️ **Accessibility Mode** - Voice controls, text-to-speech, and simplified UI.
- 📸 **Handwriting OCR** - Capture and process handwritten responses (mocked for demo).
- 📊 **Teacher Dashboard** - Detailed analytics and manual review capabilities.
- 🔒 **Role-Based Access** - Secure login for Admins, Teachers, and Students.

---

## 📞 Support

If you encounter any issues:
1. Ensure **MongoDB** is running.
2. Check that the backend `.env` has the correct `MONGODB_URL`.
3. Verify both servers are running (8000 and 3000).

---

**Built with ❤️ for accessible education | Final Year Project 2026**
