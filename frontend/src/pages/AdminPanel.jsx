import { useState, useEffect } from 'react';
import { adminAPI, examsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user?.role !== 'admin' && user?.role !== 'teacher') {
            navigate('/dashboard');
            return;
        }
        loadData();
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersData, examsData] = await Promise.all([
                adminAPI.listUsers(),
                examsAPI.getAvailable() // Using available for simplicity, admin should ideally see all
            ]);
            setUsers(usersData);
            setExams(examsData);
        } catch (err) {
            setError('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            await adminAPI.updateUserRole(userId, newRole);
            setSuccess('User role updated successfully');
            loadData();
        } catch (err) {
            setError('Failed to update user role');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await adminAPI.deleteUser(userId);
            setSuccess('User deleted successfully');
            loadData();
        } catch (err) {
            setError('Failed to delete user');
        }
    };

    const handleDeleteExam = async (examId) => {
        if (!window.confirm('Are you sure you want to delete this exam?')) return;
        try {
            await adminAPI.deleteExam(examId);
            setSuccess('Exam deleted successfully');
            loadData();
        } catch (err) {
            setError('Failed to delete exam');
        }
    };

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    return (
        <main className="page">
            <div className="container">
                <header className="mb-xl">
                    <h1>Admin Panel</h1>
                    <p className="text-secondary">Manage users, roles, and examinations</p>
                </header>

                {error && <div className="alert alert-error mb-lg">{error}</div>}
                {success && <div className="alert alert-success mb-lg">{success}</div>}

                <section className="mb-2xl">
                    <h2 className="mb-lg">👥 User Management</h2>
                    <div className="card overflow-auto">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                    <th style={{ padding: 'var(--space-sm)' }}>Name</th>
                                    <th style={{ padding: 'var(--space-sm)' }}>Email</th>
                                    <th style={{ padding: 'var(--space-sm)' }}>Role</th>
                                    <th style={{ padding: 'var(--space-sm)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: 'var(--space-sm)' }}>{u.full_name}</td>
                                        <td style={{ padding: 'var(--space-sm)' }}>{u.email}</td>
                                        <td style={{ padding: 'var(--space-sm)' }}>
                                            <select
                                                className="input"
                                                style={{ width: 'auto', padding: '4px 8px' }}
                                                value={u.role}
                                                onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                                                disabled={u.id === user.id || (user.role === 'teacher' && u.role !== 'student')}
                                            >
                                                <option value="student">Student</option>
                                                {user.role === 'admin' && (
                                                    <>
                                                        <option value="teacher">Teacher</option>
                                                        <option value="admin">Admin</option>
                                                    </>
                                                )}
                                            </select>
                                        </td>
                                        <td style={{ padding: 'var(--space-sm)' }}>
                                            <button
                                                className="btn btn-ghost"
                                                style={{ color: 'var(--accent-danger)' }}
                                                onClick={() => handleDeleteUser(u.id)}
                                                disabled={u.id === user.id || (user.role === 'teacher' && u.role !== 'student')}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section>
                    <h2 className="mb-lg">📝 Global Exam Management</h2>
                    <div className="grid grid-3">
                        {exams.map(exam => (
                            <article key={exam.id} className="card">
                                <h3 className="card-title">{exam.title}</h3>
                                <p className="card-text text-secondary mb-lg">{exam.description}</p>
                                <button
                                    className="btn btn-secondary btn-block"
                                    style={{ borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)' }}
                                    onClick={() => handleDeleteExam(exam.id)}
                                >
                                    Delete Exam
                                </button>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
