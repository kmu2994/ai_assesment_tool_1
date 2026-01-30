# 🎓 AI Inclusive Assessment System

An AI-powered, accessible examination platform featuring adaptive testing, semantic grading, voice interaction, and handwriting OCR. This project is designed to provide an inclusive assessment environment for all students.

---

## ✨ Features

- 🧠 **Adaptive Testing**: Questions adjust dynamically to the student's ability level using Bayesian logic.
- ✍️ **AI Grading**: Semantic similarity analysis for descriptive answers using Sentence-Transformers.
- 🎙️ **Voice Interaction**: Full speech-to-text support for answering questions and text-to-speech for accessibility.
- 🖼️ **Handwriting OCR**: Support for uploading handwritten answers which are automatically converted and graded.
- 📊 **Real-time Analytics**: Detailed dashboards for Students, Teachers, and Admins to track performance.
- ♿ **Inclusive Design**: High-contrast modes, font adjustments, and screen reader compatibility.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Shadcn/UI, Recharts.
- **Backend**: FastAPI (Python), SQLAlchemy, SQLite, Pydantic.
- **AI/ML**: Sentence-Transformers (SBERT), PyTorch, Pytesseract (OCR).

---

## 🚀 Setup Instructions

### 1. Prerequisites
- **Python 3.10+** (Checked for Python 3.14 compatibility)
- **Node.js 20.10+**
- **Tesseract OCR** (Required for handwriting recognition)

### 2. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # Mac/Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Initialize the database and demo data:
   ```bash
   python seed_db.py
   ```
5. Start the server:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Access the app at `http://localhost:3000` (or the port shown in your terminal).

---

## 🔑 Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `admin123` |
| **Teacher** | `teacher` | `teacher123` |
| **Student** | `student` | `student123` |

---

## 📁 Project Structure

```text
ai_assesment_tool_1/
├── backend/            # FastAPI Application
│   ├── app/            # Core logic, agents, and API
│   ├── data/           # Database and uploads (Git ignored)
│   ├── seed_db.py      # Database initializer
│   └── requirements.txt
├── frontend/           # React Application
│   ├── src/            # Components, pages, and hooks
│   └── package.json
└── README.md
```

---

## 📄 License

This project is open-source and available under the MIT License.

**Built for Accessible Education | 2026**
