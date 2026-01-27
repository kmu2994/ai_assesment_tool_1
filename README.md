# 🎓 AI Inclusive Assessment System

An AI-powered, accessible examination platform with adaptive testing, semantic grading, and full accessibility support.

---

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

| Software | Version | Download Link |
|----------|---------|---------------|
| **Python** | 3.10 - 3.12 | [python.org](https://www.python.org/downloads/) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

> ⚠️ **Note**: Python 3.14 may have compatibility issues with some AI libraries. Python 3.11 or 3.12 is recommended.

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

#### 2.5 Initialize the database with sample data
```bash
python seed_db.py
```

This creates:
- Admin user: `admin` / `admin123`
- Teacher user: `teacher` / `teacher123`
- Student user: `student` / `student123`
- Sample exam with questions

#### 2.6 Start the backend server
```bash
python -m uvicorn app.main:app --reload --port 8000 --host 127.0.0.1
```

✅ Backend should now be running at: **http://127.0.0.1:8000**

You can view the API docs at: **http://127.0.0.1:8000/docs**

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

✅ Frontend should now be running at: **http://localhost:5173**

---

## 🎯 Access the Application

Open your browser and go to: **http://localhost:5173**

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
├── backend/                 # Python FastAPI Backend
│   ├── app/
│   │   ├── api/            # API routes (auth, exams, analytics)
│   │   ├── agents/         # AI agents (grading, adaptive, OCR)
│   │   ├── core/           # Security, config
│   │   └── db/             # Database models
│   ├── data/               # SQLite database
│   ├── requirements.txt    # Python dependencies
│   └── seed_db.py          # Database seeder
│
├── frontend/               # React Vite Frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # Auth context
│   │   ├── pages/          # Page components
│   │   └── services/       # API service
│   ├── package.json        # Node dependencies
│   └── index.html          # Entry HTML
│
└── README.md               # This file
```

---

## 🔧 Troubleshooting

### Problem: Backend won't start
```bash
# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### Problem: Port 8000 already in use
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :8000
kill -9 <PID>
```

### Problem: Port 5173 already in use
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Problem: Database errors
```bash
# Delete and recreate the database
cd backend
del data\assessment.db    # Windows
rm data/assessment.db     # Mac/Linux
python seed_db.py
```

---

## 🛠️ Common Commands Reference

| Task | Command |
|------|---------|
| Start Backend | `cd backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000` |
| Start Frontend | `cd frontend && npm run dev` |
| Reseed Database | `cd backend && python seed_db.py` |
| Install Backend Deps | `cd backend && pip install -r requirements.txt` |
| Install Frontend Deps | `cd frontend && npm install` |

---

## ✨ Features

- ✅ **Adaptive Testing** - Questions adjust to student ability
- ✅ **AI Grading** - Semantic similarity for descriptive answers
- ✅ **Voice Controls** - Speech-to-text for answers
- ✅ **Handwriting OCR** - Upload handwritten answers
- ✅ **Role-Based Access** - Admin, Teacher, Student roles
- ✅ **Exam History** - Track past performance
- ✅ **Dark Theme** - Easy on the eyes
- ✅ **Fully Responsive** - Works on mobile and desktop

---

## 📞 Support

If you encounter any issues, check:
1. Both servers are running (backend on 8000, frontend on 5173)
2. Virtual environment is activated for Python
3. Database is seeded with `python seed_db.py`

---

**Built with ❤️ for accessible education | Final Year Project 2026**
