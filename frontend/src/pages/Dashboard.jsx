import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI, examsAPI } from '../services/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [exams, setExams] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, [user]);

    const loadDashboard = async () => {
        try {
            if (user?.role === 'student') {
                const [statsData, examsData] = await Promise.all([
                    analyticsAPI.getMyStats(),
                    examsAPI.getAvailable()
                ]);
                setStats(statsData.analytics);
                setHistory(statsData.history || []);
                setExams(examsData);
            } else if (user?.role === 'teacher') {
                const data = await analyticsAPI.getTeacherDashboard();
                setStats(data);
            } else if (user?.role === 'admin') {
                const data = await analyticsAPI.getAdminDashboard();
                setStats(data);
            }
        } catch (err) {
            console.error('Failed to load dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-overlay" aria-live="polite" aria-busy="true">
                <div className="spinner" role="status">
                    <span className="sr-only">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    return (
        <main id="main-content" className="page">
            <div className="container">
                {/* Welcome Header */}
                <header className="mb-xl">
                    <h1 className="mb-sm">
                        Welcome, {user?.full_name || user?.username}! 👋
                    </h1>
                    <p className="text-secondary">
                        {user?.role === 'student' ? 'Track your progress and take exams' :
                            user?.role === 'teacher' ? 'Manage exams and view analytics' :
                                'System administration dashboard'}
                    </p>
                </header>

                {/* Student Dashboard */}
                {user?.role === 'student' && (
                    <>
                        {/* Stats Grid */}
                        <section
                            className="mb-xl"
                            aria-labelledby="stats-title"
                        >
                            <h2 id="stats-title" className="sr-only">
                                Your Statistics
                            </h2>
                            <div className="grid grid-4">
                                <article className="stat-card">
                                    <div className="stat-value" aria-label="Exams taken">
                                        {stats?.total_exams || 0}
                                    </div>
                                    <div className="stat-label">Exams Taken</div>
                                </article>

                                <article className="stat-card">
                                    <div className="stat-value" aria-label="Average score">
                                        {stats?.average_score?.toFixed(1) || 0}%
                                    </div>
                                    <div className="stat-label">Average Score</div>
                                </article>

                                <article className="stat-card">
                                    <div className="stat-value" aria-label="Best score">
                                        {stats?.best_score || 0}%
                                    </div>
                                    <div className="stat-label">Best Score</div>
                                </article>

                                <article className="stat-card">
                                    <div
                                        className="stat-value"
                                        style={{ textTransform: 'capitalize' }}
                                        aria-label={`Performance trend: ${stats?.trend || 'N/A'}`}
                                    >
                                        {stats?.trend || 'N/A'}
                                    </div>
                                    <div className="stat-label">Trend</div>
                                </article>
                            </div>
                        </section>

                        {/* Available Exams */}
                        <section className="mb-2xl" aria-labelledby="exams-title">
                            <h2 id="exams-title" className="mb-lg">
                                📝 Available Exams
                            </h2>

                            {exams.length > 0 ? (
                                <div className="grid grid-3">
                                    {exams.map(exam => (
                                        <article
                                            key={exam.id}
                                            className="card"
                                            aria-labelledby={`exam-${exam.id}-title`}
                                        >
                                            <h3
                                                id={`exam-${exam.id}-title`}
                                                className="card-title"
                                            >
                                                {exam.title}
                                            </h3>

                                            <p className="card-text mb-md">
                                                {exam.description || 'No description available'}
                                            </p>

                                            <div
                                                className="flex flex-wrap gap-md mb-lg text-secondary"
                                                style={{ fontSize: 'var(--font-sm)' }}
                                            >
                                                <span aria-label={`Duration: ${exam.duration_minutes} minutes`}>
                                                    ⏱️ {exam.duration_minutes} min
                                                </span>
                                                <span aria-label={`Passing score: ${exam.passing_score} percent`}>
                                                    📊 Pass: {exam.passing_score}%
                                                </span>
                                            </div>

                                            <Link
                                                to={`/exam/${exam.id}`}
                                                className="btn btn-primary btn-block"
                                                aria-label={`Start ${exam.title} exam`}
                                            >
                                                Start Exam
                                            </Link>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <div className="card text-center" style={{ padding: 'var(--space-2xl)' }}>
                                    <p className="text-secondary">
                                        No new exams available.
                                    </p>
                                </div>
                            )}
                        </section>

                        {/* Exam History */}
                        <section aria-labelledby="history-title">
                            <h2 id="history-title" className="mb-lg">
                                🕒 Your Exam History
                            </h2>

                            {history.length > 0 ? (
                                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                                                    <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Exam</th>
                                                    <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Date</th>
                                                    <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Score</th>
                                                    <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Result</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {history.map(item => (
                                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: 'var(--space-md)' }}>{item.exam_title}</td>
                                                        <td style={{ padding: 'var(--space-md)', color: 'var(--text-secondary)' }}>
                                                            {new Date(item.submitted_at).toLocaleDateString()}
                                                        </td>
                                                        <td style={{ padding: 'var(--space-md)', fontWeight: 'bold' }}>
                                                            {item.percentage.toFixed(1)}%
                                                        </td>
                                                        <td style={{ padding: 'var(--space-md)' }}>
                                                            <span className={`badge ${item.percentage >= 40 ? 'badge-success' : 'badge-danger'}`}>
                                                                {item.percentage >= 40 ? 'Passed' : 'Failed'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="card text-center" style={{ padding: 'var(--space-xl)' }}>
                                    <p className="text-secondary">You haven't completed any exams yet.</p>
                                </div>
                            )}
                        </section>
                    </>
                )}

                {/* Teacher Dashboard */}
                {user?.role === 'teacher' && (
                    <section aria-labelledby="teacher-stats-title">
                        <h2 id="teacher-stats-title" className="sr-only">
                            Teacher Dashboard
                        </h2>

                        <div className="grid grid-3">
                            <article className="stat-card">
                                <div className="stat-value">
                                    {stats?.total_exams_created || 0}
                                </div>
                                <div className="stat-label">Exams Created</div>
                            </article>

                            <article className="stat-card">
                                <div className="stat-value">
                                    {stats?.total_submissions || 0}
                                </div>
                                <div className="stat-label">Total Submissions</div>
                            </article>

                            <Link
                                to="/manage"
                                className="card flex items-center justify-center"
                                style={{
                                    minHeight: '120px',
                                    textDecoration: 'none'
                                }}
                                aria-label="Create a new exam"
                            >
                                <span style={{ fontSize: 'var(--font-xl)' }}>
                                    ➕ Create New Exam
                                </span>
                            </Link>
                        </div>

                        {/* Student Submissions Table */}
                        <div className="mt-xl">
                            <h3 className="mb-md">📋 Student Exam Results</h3>
                            {stats?.student_submissions?.length > 0 ? (
                                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
                                                    <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Student</th>
                                                    <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Exam</th>
                                                    <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Score</th>
                                                    <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Date</th>
                                                    <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Result</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.student_submissions.map(sub => (
                                                    <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: 'var(--space-md)' }}>
                                                            <strong>{sub.student_name}</strong>
                                                            <br />
                                                            <span className="text-secondary" style={{ fontSize: 'var(--font-sm)' }}>
                                                                @{sub.student_username}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: 'var(--space-md)' }}>{sub.exam_title}</td>
                                                        <td style={{ padding: 'var(--space-md)', fontWeight: 'bold' }}>
                                                            {sub.percentage?.toFixed(1) || 0}%
                                                        </td>
                                                        <td style={{ padding: 'var(--space-md)', color: 'var(--text-secondary)' }}>
                                                            {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : '-'}
                                                        </td>
                                                        <td style={{ padding: 'var(--space-md)' }}>
                                                            <span className={`badge ${sub.percentage >= 40 ? 'badge-success' : 'badge-danger'}`}>
                                                                {sub.percentage >= 40 ? 'Passed' : 'Failed'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="card text-center" style={{ padding: 'var(--space-xl)' }}>
                                    <p className="text-secondary">No student submissions yet.</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Admin Dashboard */}
                {user?.role === 'admin' && (
                    <section aria-labelledby="admin-stats-title">
                        <h2 id="admin-stats-title" className="sr-only">
                            Admin Dashboard
                        </h2>

                        <div className="grid grid-4">
                            <article className="stat-card">
                                <div className="stat-value">
                                    {stats?.total_users || 0}
                                </div>
                                <div className="stat-label">Total Users</div>
                            </article>

                            <article className="stat-card">
                                <div className="stat-value">
                                    {stats?.total_exams || 0}
                                </div>
                                <div className="stat-label">Total Exams</div>
                            </article>

                            <article className="stat-card">
                                <div className="stat-value">
                                    {stats?.total_submissions || 0}
                                </div>
                                <div className="stat-label">Submissions</div>
                            </article>

                            <article className="stat-card">
                                <div className="stat-value">
                                    {stats?.users_by_role?.students || 0}
                                </div>
                                <div className="stat-label">Students</div>
                            </article>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-2 mt-xl">
                            <Link
                                to="/manage"
                                className="card flex items-center justify-center"
                                style={{
                                    minHeight: '100px',
                                    textDecoration: 'none'
                                }}
                            >
                                <span>⚙️ Manage Exams</span>
                            </Link>

                            <Link
                                to="/admin"
                                className="card flex items-center justify-center"
                                style={{
                                    minHeight: '100px',
                                    textDecoration: 'none'
                                }}
                            >
                                <span>🛡️ Admin Panel</span>
                            </Link>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
