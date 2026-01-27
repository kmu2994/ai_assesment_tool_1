import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'student',
        accessibility_mode: false
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Registration attempt started for:', formData.email);
        setError('');
        setLoading(true);

        try {
            console.log('Sending registration request to backend...');
            await authAPI.register(formData);
            console.log('Registration successful! Redirecting to login.');
            navigate('/login', {
                state: { message: 'Registration successful! Please sign in.' }
            });
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (err.customMessage) {
                setError(err.customMessage);
            } else if (Array.isArray(detail)) {
                // Handle FastAPI validation errors
                setError(detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join(', '));
            } else if (typeof detail === 'string') {
                setError(detail);
            } else {
                setError('Registration failed. Please check your inputs and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main id="main-content" className="page flex items-center justify-center">
            <div className="container" style={{ maxWidth: '480px' }}>
                <article className="form-card">
                    {/* Header */}
                    <header className="text-center mb-xl">
                        <h1 className="mb-sm">Create Account</h1>
                        <p className="text-secondary">
                            Join our inclusive assessment platform
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

                    {/* Registration Form */}
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <label htmlFor="full_name" className="form-label">
                                Full Name
                            </label>
                            <input
                                id="full_name"
                                name="full_name"
                                type="text"
                                className="input"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                required
                                autoComplete="name"
                                aria-required="true"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="username" className="form-label">
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                className="input"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="johndoe"
                                required
                                autoComplete="username"
                                aria-required="true"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="input"
                                value={formData.email}
                                onChange={handleChange}
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
                                name="password"
                                type="password"
                                className="input"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                autoComplete="new-password"
                                aria-required="true"
                                aria-describedby="password-hint"
                            />
                            <small
                                id="password-hint"
                                className="text-muted"
                                style={{
                                    display: 'block',
                                    marginTop: 'var(--space-xs)',
                                    fontSize: 'var(--font-xs)'
                                }}
                            >
                                Minimum 6 characters
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="role" className="form-label">
                                I am a...
                            </label>
                            <select
                                id="role"
                                name="role"
                                className="input"
                                value={formData.role}
                                onChange={handleChange}
                                aria-describedby="role-hint"
                            >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Administrator</option>
                            </select>
                            <small
                                id="role-hint"
                                className="text-muted"
                                style={{
                                    display: 'block',
                                    marginTop: 'var(--space-xs)',
                                    fontSize: 'var(--font-xs)'
                                }}
                            >
                                Select your role in the platform
                            </small>
                        </div>

                        {/* Accessibility Toggle */}
                        <div
                            className="form-group"
                            style={{
                                padding: 'var(--space-md)',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--border-radius)'
                            }}
                        >
                            <label className="checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    name="accessibility_mode"
                                    checked={formData.accessibility_mode}
                                    onChange={handleChange}
                                    aria-describedby="accessibility-hint"
                                />
                                <span>
                                    <strong>Enable Accessibility Mode</strong>
                                </span>
                            </label>
                            <small
                                id="accessibility-hint"
                                className="text-muted"
                                style={{
                                    display: 'block',
                                    marginTop: 'var(--space-sm)',
                                    fontSize: 'var(--font-xs)',
                                    marginLeft: '28px'
                                }}
                            >
                                Enables voice controls, screen reader optimizations,
                                and other accessibility features
                            </small>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg btn-block"
                            disabled={loading || !formData.email || !formData.password || !formData.username}
                            aria-busy={loading}
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Footer */}
                    <footer className="text-center mt-xl">
                        <p className="text-secondary">
                            Already have an account?{' '}
                            <Link to="/login">
                                Sign in
                            </Link>
                        </p>
                    </footer>
                </article>
            </div>
        </main>
    );
}
