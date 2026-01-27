import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Login attempt started for:', email);
        setError('');
        setLoading(true);

        try {
            console.log('Sending request to backend...');
            const data = await authAPI.login({ email, password });
            console.log('Login successful, receiving user data:', data.user.username);
            login(data.user, data.access_token);
            navigate('/dashboard');
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (err.customMessage) {
                setError(err.customMessage);
            } else if (Array.isArray(detail)) {
                setError(detail.map(e => e.msg).join(', '));
            } else if (typeof detail === 'string') {
                setError(detail);
            } else {
                setError('Login failed. Please check your credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main id="main-content" className="page flex items-center justify-center">
            <div className="container" style={{ maxWidth: '440px' }}>
                <article className="form-card">
                    {/* Header */}
                    <header className="text-center mb-xl">
                        <h1 className="mb-sm">Welcome Back</h1>
                        <p className="text-secondary">
                            Sign in to your account to continue
                        </p>
                    </header>

                    {/* Error Alert */}
                    {error && (
                        <div
                            className="alert alert-error"
                            role="alert"
                            aria-live="polite"
                        >
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                autoComplete="email"
                                aria-required="true"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                className="input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                aria-required="true"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg btn-block"
                            disabled={loading || !email || !password}
                            aria-busy={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Footer */}
                    <footer className="text-center mt-xl">
                        <p className="text-secondary">
                            Don't have an account?{' '}
                            <Link to="/register">
                                Create one
                            </Link>
                        </p>
                    </footer>

                    {/* Demo Credentials */}
                    <div
                        className="mt-lg"
                        style={{
                            padding: 'var(--space-md)',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--border-radius)',
                            fontSize: 'var(--font-xs)'
                        }}
                    >
                        <p className="text-center text-muted mb-sm">
                            <strong>Demo Accounts:</strong>
                        </p>
                        <div className="text-muted" style={{
                            display: 'grid',
                            gap: 'var(--space-xs)',
                            fontSize: 'var(--font-xs)'
                        }}>
                            <div>👤 <strong>Student:</strong> student@example.com / student123</div>
                            <div>👨‍🏫 <strong>Teacher:</strong> teacher@example.com / teacher123</div>
                            <div>🔧 <strong>Admin:</strong> admin@example.com / admin123</div>
                        </div>
                    </div>
                </article>
            </div>
        </main>
    );
}
