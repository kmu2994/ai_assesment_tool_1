import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ExamPage from './pages/ExamPage';
import ManageExams from './pages/ManageExams';
import AdminPanel from './pages/AdminPanel';
import './index.css';

function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="loading-overlay"><div className="spinner"></div></div>;
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/exam/:examId" element={<ProtectedRoute><ExamPage /></ProtectedRoute>} />
            <Route path="/exams" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/manage" element={<ProtectedRoute><ManageExams /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Navbar />
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
