import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-container">
                    <h1 className="hero-title">
                        <span className="hero-gradient">AI-Powered</span>
                        <br />
                        Inclusive Assessment
                    </h1>
                    <p className="hero-subtitle">
                        A fair, accessible, and intelligent examination platform that adapts
                        to every student's needs. Built for the future of education.
                    </p>
                    <div className="hero-buttons">
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="btn btn-primary btn-lg">
                                Go to Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" className="btn btn-primary btn-lg">
                                    Get Started Free
                                </Link>
                                <Link to="/login" className="btn btn-secondary btn-lg">
                                    Sign In
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="stats-container">
                    <div className="stat-item">
                        <span className="stat-number">10K+</span>
                        <span className="stat-text">Students</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">500+</span>
                        <span className="stat-text">Exams</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">99.9%</span>
                        <span className="stat-text">Uptime</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">4.9★</span>
                        <span className="stat-text">Rating</span>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="section-container">
                    <h2 className="section-title">Key Features</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">🎯</div>
                            <h3>Adaptive Testing</h3>
                            <p>Questions adjust difficulty based on your performance using IRT algorithms.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🤖</div>
                            <h3>AI Grading</h3>
                            <p>Semantic analysis understands meaning, not just keywords for fair evaluation.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">♿</div>
                            <h3>Fully Accessible</h3>
                            <p>Voice controls, screen reader support, and keyboard navigation built-in.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">✍️</div>
                            <h3>Handwriting OCR</h3>
                            <p>Upload handwritten answers and get them graded automatically.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">📊</div>
                            <h3>Smart Analytics</h3>
                            <p>Track progress, identify weak areas, and get personalized insights.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🔒</div>
                            <h3>Secure & Fair</h3>
                            <p>Role-based access and unbiased AI evaluation for integrity.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="howit-section">
                <div className="section-container">
                    <h2 className="section-title">How It Works</h2>
                    <div className="steps-grid">
                        <div className="step-card">
                            <div className="step-number">1</div>
                            <h3>Create or Take Exams</h3>
                            <p>Teachers create adaptive exams. Students take them at their own pace.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-number">2</div>
                            <h3>AI Adapts & Grades</h3>
                            <p>AI adjusts difficulty and provides semantic grading that understands context.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-number">3</div>
                            <h3>Get Insights</h3>
                            <p>Receive detailed feedback and track your progress over time.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="tech-section">
                <div className="section-container">
                    <h2 className="section-title">100% Open Source & Free</h2>
                    <p className="tech-description">
                        Built with Python, FastAPI, React, and powered by local AI models.
                        No paid APIs. Runs on CPU. Works offline.
                    </p>
                    <div className="tech-badges">
                        {['Python', 'FastAPI', 'React', 'SQLite', 'SBERT', 'Tesseract'].map(tech => (
                            <span key={tech} className="tech-badge">{tech}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            {!isAuthenticated && (
                <section className="cta-section">
                    <div className="section-container">
                        <h2 className="section-title">Ready to Get Started?</h2>
                        <p className="cta-text">
                            Join thousands of students and educators using our AI-powered assessment platform.
                        </p>
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Create Free Account
                        </Link>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="home-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <h3>🎓 AI Assessment</h3>
                        <p>Empowering education through AI-powered, accessible, and fair assessment technology.</p>
                    </div>
                    <div className="footer-links">
                        <h4>Quick Links</h4>
                        <Link to="/">Home</Link>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </div>
                    <div className="footer-contact">
                        <h4>Contact</h4>
                        <p>📧 support@aiassessment.edu</p>
                        <p>📍 University Campus, India</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} AI Inclusive Assessment System. All rights reserved.</p>
                    <p>Built with ❤️ for accessible education | Final Year Project 2026</p>
                </div>
            </footer>

            {/* Scoped Styles */}
            <style>{`
                .home-page {
                    min-height: 100vh;
                    background: var(--bg-primary);
                    padding-top: var(--navbar-height);
                }

                /* Hero Section */
                .hero-section {
                    min-height: 80vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 3rem 1.5rem;
                    background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
                }
                .hero-container {
                    max-width: 800px;
                }
                .hero-title {
                    font-size: clamp(2.5rem, 6vw, 4rem);
                    font-weight: 700;
                    line-height: 1.1;
                    margin-bottom: 1.5rem;
                    color: var(--text-primary);
                }
                .hero-gradient {
                    background: var(--gradient-primary);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .hero-subtitle {
                    font-size: 1.25rem;
                    color: var(--text-secondary);
                    margin-bottom: 2rem;
                    line-height: 1.6;
                }
                .hero-buttons {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                /* Stats Section */
                .stats-section {
                    background: var(--bg-secondary);
                    padding: 2rem 1.5rem;
                    border-top: 1px solid var(--border-color);
                    border-bottom: 1px solid var(--border-color);
                }
                .stats-container {
                    max-width: 1000px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1rem;
                    text-align: center;
                }
                .stat-item {
                    padding: 1rem;
                }
                .stat-number {
                    display: block;
                    font-size: 2rem;
                    font-weight: 700;
                    background: var(--gradient-primary);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .stat-text {
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                }

                /* Section Styles */
                .section-container {
                    max-width: 1140px;
                    margin: 0 auto;
                    padding: 4rem 1.5rem;
                }
                .section-title {
                    text-align: center;
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 2.5rem;
                    color: var(--text-primary);
                }

                /* Features Section */
                .features-section {
                    background: var(--bg-primary);
                }
                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                }
                .feature-card {
                    background: var(--bg-card);
                    border-radius: 12px;
                    padding: 2rem;
                    border: 1px solid var(--border-color);
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .feature-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                }
                .feature-icon {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                }
                .feature-card h3 {
                    color: var(--text-primary);
                    margin-bottom: 0.5rem;
                    font-size: 1.25rem;
                }
                .feature-card p {
                    color: var(--text-secondary);
                    line-height: 1.5;
                }

                /* How It Works */
                .howit-section {
                    background: var(--bg-secondary);
                }
                .steps-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 2rem;
                }
                .step-card {
                    text-align: center;
                    padding: 2rem;
                    background: var(--bg-card);
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                }
                .step-number {
                    width: 50px;
                    height: 50px;
                    background: var(--gradient-primary);
                    border-radius: 50%;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 1rem;
                }
                .step-card h3 {
                    color: var(--text-primary);
                    margin-bottom: 0.5rem;
                }
                .step-card p {
                    color: var(--text-secondary);
                }

                /* Tech Section */
                .tech-section {
                    background: var(--bg-primary);
                    text-align: center;
                }
                .tech-description {
                    color: var(--text-secondary);
                    max-width: 540px;
                    margin: 0 auto 2rem;
                    line-height: 1.6;
                }
                .tech-badges {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 0.75rem;
                }
                .tech-badge {
                    background: var(--bg-elevated);
                    color: var(--accent-primary);
                    padding: 0.5rem 1.25rem;
                    border-radius: 20px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    border: 1px solid var(--border-color);
                }

                /* CTA Section */
                .cta-section {
                    background: var(--bg-secondary);
                    text-align: center;
                }
                .cta-text {
                    color: var(--text-secondary);
                    margin-bottom: 1.5rem;
                    max-width: 480px;
                    margin-left: auto;
                    margin-right: auto;
                }

                /* Footer */
                .home-footer {
                    background: var(--bg-secondary);
                    border-top: 1px solid var(--border-color);
                    padding: 3rem 1.5rem 1.5rem;
                    margin-top: 0;
                }
                .footer-content {
                    max-width: 1140px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr;
                    gap: 2rem;
                    padding-bottom: 2rem;
                    border-bottom: 1px solid var(--border-color);
                }
                .footer-brand h3 {
                    color: var(--text-primary);
                    margin-bottom: 0.75rem;
                    font-size: 1.25rem;
                }
                .footer-brand p {
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                    line-height: 1.6;
                }
                .footer-links h4, .footer-contact h4 {
                    color: var(--text-primary);
                    margin-bottom: 1rem;
                    font-size: 1rem;
                }
                .footer-links a {
                    display: block;
                    color: var(--text-secondary);
                    text-decoration: none;
                    margin-bottom: 0.5rem;
                    font-size: 0.875rem;
                    transition: color 0.2s;
                }
                .footer-links a:hover {
                    color: var(--accent-primary);
                }
                .footer-contact p {
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                    margin-bottom: 0.5rem;
                }
                .footer-bottom {
                    max-width: 1140px;
                    margin: 0 auto;
                    padding-top: 1.5rem;
                    text-align: center;
                }
                .footer-bottom p {
                    color: var(--text-muted);
                    font-size: 0.875rem;
                    margin-bottom: 0.25rem;
                }

                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .stats-container {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .footer-content {
                        grid-template-columns: 1fr;
                        text-align: center;
                    }
                    .hero-section {
                        min-height: 70vh;
                    }
                }
            `}</style>
        </div>
    );
}
