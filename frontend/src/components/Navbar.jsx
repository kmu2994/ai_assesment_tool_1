import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    const handleLogout = () => {
        logout();
        setMobileMenuOpen(false);
        navigate('/login');
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
        <>
            {/* Skip to main content link for accessibility */}
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>

            <nav
                className="navbar"
                role="navigation"
                aria-label="Main navigation"
            >
                <div className="navbar-content">
                    {/* Brand/Logo */}
                    <Link
                        to="/"
                        className="navbar-brand"
                        aria-label="AI Assessment - Home"
                    >
                        🎓 AI Assessment
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="navbar-links" role="menubar">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    role="menuitem"
                                    aria-current={location.pathname === '/dashboard' ? 'page' : undefined}
                                >
                                    Dashboard
                                </Link>

                                {user?.role === 'student' && (
                                    <Link
                                        to="/exams"
                                        role="menuitem"
                                        aria-current={location.pathname === '/exams' ? 'page' : undefined}
                                    >
                                        Take Exam
                                    </Link>
                                )}

                                {(user?.role === 'teacher' || user?.role === 'admin') && (
                                    <Link
                                        to="/manage"
                                        role="menuitem"
                                        aria-current={location.pathname === '/manage' ? 'page' : undefined}
                                    >
                                        Manage Exams
                                    </Link>
                                )}

                                <div className="navbar-user">
                                    <span>{user?.username}</span>
                                    <span style={{
                                        padding: '2px 8px',
                                        background: 'var(--bg-elevated)',
                                        borderRadius: '4px',
                                        fontSize: 'var(--font-xs)',
                                        textTransform: 'capitalize'
                                    }}>
                                        {user?.role}
                                    </span>
                                </div>

                                <button
                                    className="btn btn-secondary"
                                    onClick={handleLogout}
                                    aria-label="Log out of your account"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    role="menuitem"
                                    aria-current={location.pathname === '/login' ? 'page' : undefined}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn btn-primary"
                                    role="menuitem"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="navbar-toggle"
                        onClick={toggleMobileMenu}
                        aria-expanded={mobileMenuOpen}
                        aria-controls="mobile-menu"
                        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                    >
                        {mobileMenuOpen ? '✕' : '☰'}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <div
                id="mobile-menu"
                className={`navbar-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}
                role="menu"
                aria-hidden={!mobileMenuOpen}
            >
                {isAuthenticated && (
                    <div className="navbar-mobile-user">
                        <strong>{user?.full_name || user?.username}</strong>
                        <span>{user?.role}</span>
                    </div>
                )}

                {isAuthenticated ? (
                    <>
                        <Link
                            to="/dashboard"
                            role="menuitem"
                            tabIndex={mobileMenuOpen ? 0 : -1}
                        >
                            📊 Dashboard
                        </Link>

                        {user?.role === 'student' && (
                            <Link
                                to="/exams"
                                role="menuitem"
                                tabIndex={mobileMenuOpen ? 0 : -1}
                            >
                                📝 Take Exam
                            </Link>
                        )}

                        {(user?.role === 'teacher' || user?.role === 'admin') && (
                            <Link
                                to="/manage"
                                role="menuitem"
                                tabIndex={mobileMenuOpen ? 0 : -1}
                            >
                                ⚙️ Manage Exams
                            </Link>
                        )}

                        <button
                            onClick={handleLogout}
                            role="menuitem"
                            tabIndex={mobileMenuOpen ? 0 : -1}
                            style={{
                                marginTop: 'auto',
                                background: 'var(--accent-danger)',
                                borderColor: 'var(--accent-danger)'
                            }}
                        >
                            🚪 Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link
                            to="/login"
                            role="menuitem"
                            tabIndex={mobileMenuOpen ? 0 : -1}
                        >
                            🔑 Login
                        </Link>
                        <Link
                            to="/register"
                            role="menuitem"
                            tabIndex={mobileMenuOpen ? 0 : -1}
                            style={{
                                background: 'var(--gradient-primary)',
                                borderColor: 'transparent',
                                color: 'white'
                            }}
                        >
                            ✨ Register
                        </Link>
                    </>
                )}
            </div>

            {/* Overlay backdrop */}
            {mobileMenuOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 998
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}
        </>
    );
}
