import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ManageExams() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [examData, setExamData] = useState({
        title: '',
        description: '',
        duration_minutes: 60,
        total_marks: 100,
        passing_score: 40,
        is_adaptive: true,
        questions: []
    });
    const [currentQuestion, setCurrentQuestion] = useState({
        question_text: '',
        question_type: 'mcq',
        difficulty: 0.5,
        points: 1,
        options: { A: '', B: '', C: '', D: '' },
        correct_answer: 'A',
        model_answer: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const addQuestion = () => {
        if (!currentQuestion.question_text.trim()) {
            setError('Please enter a question');
            return;
        }

        const q = { ...currentQuestion };
        if (q.question_type === 'mcq') {
            delete q.model_answer;
        } else {
            delete q.options;
            delete q.correct_answer;
        }

        setExamData(prev => ({
            ...prev,
            questions: [...prev.questions, q]
        }));

        // Reset current question
        setCurrentQuestion({
            question_text: '',
            question_type: 'mcq',
            difficulty: 0.5,
            points: 1,
            options: { A: '', B: '', C: '', D: '' },
            correct_answer: 'A',
            model_answer: ''
        });
        setError('');
    };

    const removeQuestion = (index) => {
        setExamData(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (examData.questions.length === 0) {
            setError('Please add at least one question');
            return;
        }
        setLoading(true);
        setError('');

        try {
            await examsAPI.createExam(examData);
            setSuccess('Exam created successfully!');
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create exam');
        } finally {
            setLoading(false);
        }
    };

    // Access control
    if (user?.role === 'student') {
        return (
            <main id="main-content" className="page flex items-center justify-center">
                <div className="container text-center">
                    <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
                        <h2>Access Denied</h2>
                        <p className="text-secondary">
                            Only teachers and admins can manage exams.
                        </p>
                        <button
                            className="btn btn-primary mt-lg"
                            onClick={() => navigate('/dashboard')}
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main id="main-content" className="page">
            <div className="container">
                {/* Header */}
                <header className="mb-xl">
                    <h1 className="mb-sm">Create New Exam</h1>
                    <p className="text-secondary">
                        Build an adaptive exam with MCQ and descriptive questions
                    </p>
                </header>

                {/* Alerts */}
                {error && (
                    <div
                        className="alert alert-error"
                        role="alert"
                        aria-live="polite"
                    >
                        {error}
                    </div>
                )}
                {success && (
                    <div
                        className="alert alert-success"
                        role="alert"
                        aria-live="polite"
                    >
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    {/* Two Column Layout - Stacks on Mobile */}
                    <div className="grid grid-2 mb-xl">
                        {/* Exam Details Card */}
                        <article className="card">
                            <h2 className="card-title mb-lg">📋 Exam Details</h2>

                            <div className="form-group">
                                <label htmlFor="title" className="form-label">
                                    Exam Title *
                                </label>
                                <input
                                    id="title"
                                    className="input"
                                    value={examData.title}
                                    onChange={e => setExamData(prev => ({
                                        ...prev,
                                        title: e.target.value
                                    }))}
                                    required
                                    placeholder="e.g., Midterm Exam - Physics"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description" className="form-label">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    className="textarea"
                                    rows={3}
                                    value={examData.description}
                                    onChange={e => setExamData(prev => ({
                                        ...prev,
                                        description: e.target.value
                                    }))}
                                    placeholder="Brief description of the exam..."
                                />
                            </div>

                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label htmlFor="duration" className="form-label">
                                        Duration (min)
                                    </label>
                                    <input
                                        id="duration"
                                        type="number"
                                        className="input"
                                        value={examData.duration_minutes}
                                        onChange={e => setExamData(prev => ({
                                            ...prev,
                                            duration_minutes: parseInt(e.target.value) || 60
                                        }))}
                                        min={5}
                                        max={300}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="passing" className="form-label">
                                        Pass Score (%)
                                    </label>
                                    <input
                                        id="passing"
                                        type="number"
                                        className="input"
                                        value={examData.passing_score}
                                        onChange={e => setExamData(prev => ({
                                            ...prev,
                                            passing_score: parseFloat(e.target.value) || 40
                                        }))}
                                        min={0}
                                        max={100}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="total_marks" className="form-label">
                                        Total Marks
                                    </label>
                                    <input
                                        id="total_marks"
                                        type="number"
                                        className="input"
                                        value={examData.total_marks}
                                        onChange={e => setExamData(prev => ({
                                            ...prev,
                                            total_marks: parseFloat(e.target.value) || 100
                                        }))}
                                        min={1}
                                    />
                                </div>
                            </div>

                            {/* Adaptive Toggle */}
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
                                        checked={examData.is_adaptive}
                                        onChange={e => setExamData(prev => ({
                                            ...prev,
                                            is_adaptive: e.target.checked
                                        }))}
                                    />
                                    <span>
                                        <strong>Enable Adaptive Mode</strong>
                                    </span>
                                </label>
                                <small className="text-muted" style={{
                                    display: 'block',
                                    marginTop: 'var(--space-sm)',
                                    marginLeft: '28px',
                                    fontSize: 'var(--font-xs)'
                                }}>
                                    AI adjusts question difficulty based on student performance
                                </small>
                            </div>
                        </article>

                        {/* Add Question Card */}
                        <article className="card">
                            <h2 className="card-title mb-lg">➕ Add Question</h2>

                            <div className="form-group">
                                <label htmlFor="question_text" className="form-label">
                                    Question Text *
                                </label>
                                <textarea
                                    id="question_text"
                                    className="textarea"
                                    rows={2}
                                    value={currentQuestion.question_text}
                                    onChange={e => setCurrentQuestion(prev => ({
                                        ...prev,
                                        question_text: e.target.value
                                    }))}
                                    placeholder="Enter your question here..."
                                />
                            </div>

                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label htmlFor="question_type" className="form-label">
                                        Type
                                    </label>
                                    <select
                                        id="question_type"
                                        className="input"
                                        value={currentQuestion.question_type}
                                        onChange={e => setCurrentQuestion(prev => ({
                                            ...prev,
                                            question_type: e.target.value
                                        }))}
                                    >
                                        <option value="mcq">Multiple Choice</option>
                                        <option value="descriptive">Descriptive</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="points" className="form-label">
                                        Points
                                    </label>
                                    <input
                                        id="points"
                                        type="number"
                                        className="input"
                                        value={currentQuestion.points}
                                        onChange={e => setCurrentQuestion(prev => ({
                                            ...prev,
                                            points: parseFloat(e.target.value) || 1
                                        }))}
                                        min={1}
                                        max={10}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="difficulty" className="form-label">
                                    Difficulty: <strong>{currentQuestion.difficulty}</strong>
                                </label>
                                <input
                                    id="difficulty"
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={currentQuestion.difficulty}
                                    onChange={e => setCurrentQuestion(prev => ({
                                        ...prev,
                                        difficulty: parseFloat(e.target.value)
                                    }))}
                                    style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                                    aria-valuemin="0"
                                    aria-valuemax="1"
                                    aria-valuenow={currentQuestion.difficulty}
                                />
                                <div className="flex justify-between text-muted" style={{ fontSize: 'var(--font-xs)' }}>
                                    <span>Easy</span>
                                    <span>Hard</span>
                                </div>
                            </div>

                            {/* MCQ Options */}
                            {currentQuestion.question_type === 'mcq' && (
                                <>
                                    <div className="grid grid-2">
                                        {['A', 'B', 'C', 'D'].map(opt => (
                                            <div className="form-group" key={opt}>
                                                <label
                                                    htmlFor={`option-${opt}`}
                                                    className="form-label"
                                                >
                                                    Option {opt}
                                                </label>
                                                <input
                                                    id={`option-${opt}`}
                                                    className="input"
                                                    value={currentQuestion.options[opt]}
                                                    onChange={e => setCurrentQuestion(prev => ({
                                                        ...prev,
                                                        options: {
                                                            ...prev.options,
                                                            [opt]: e.target.value
                                                        }
                                                    }))}
                                                    placeholder={`Option ${opt}`}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="form-group">
                                        <label
                                            htmlFor="correct_answer"
                                            className="form-label"
                                        >
                                            Correct Answer
                                        </label>
                                        <select
                                            id="correct_answer"
                                            className="input"
                                            value={currentQuestion.correct_answer}
                                            onChange={e => setCurrentQuestion(prev => ({
                                                ...prev,
                                                correct_answer: e.target.value
                                            }))}
                                        >
                                            {['A', 'B', 'C', 'D'].map(opt => (
                                                <option key={opt} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Descriptive Model Answer */}
                            {currentQuestion.question_type === 'descriptive' && (
                                <div className="form-group">
                                    <label
                                        htmlFor="model_answer"
                                        className="form-label"
                                    >
                                        Model Answer (for AI grading)
                                    </label>
                                    <textarea
                                        id="model_answer"
                                        className="textarea"
                                        rows={3}
                                        value={currentQuestion.model_answer}
                                        onChange={e => setCurrentQuestion(prev => ({
                                            ...prev,
                                            model_answer: e.target.value
                                        }))}
                                        placeholder="Enter the expected answer for semantic comparison..."
                                    />
                                </div>
                            )}

                            <button
                                type="button"
                                className="btn btn-secondary btn-block"
                                onClick={addQuestion}
                            >
                                + Add Question
                            </button>
                        </article>
                    </div>

                    {/* Questions List */}
                    <section
                        className="card mb-xl"
                        aria-labelledby="questions-title"
                    >
                        <h2 id="questions-title" className="card-title mb-lg">
                            📝 Questions ({examData.questions.length})
                        </h2>

                        {examData.questions.length === 0 ? (
                            <div className="text-center text-secondary" style={{
                                padding: 'var(--space-xl)'
                            }}>
                                <p>No questions added yet.</p>
                                <p className="text-muted mt-sm" style={{ fontSize: 'var(--font-sm)' }}>
                                    Use the form above to add questions
                                </p>
                            </div>
                        ) : (
                            <div
                                role="list"
                                aria-label="Added questions"
                            >
                                {examData.questions.map((q, i) => (
                                    <div
                                        key={i}
                                        role="listitem"
                                        className="flex items-center justify-between"
                                        style={{
                                            padding: 'var(--space-md)',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: 'var(--border-radius)',
                                            marginBottom: 'var(--space-sm)',
                                            gap: 'var(--space-md)'
                                        }}
                                    >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <strong>{i + 1}.</strong>{' '}
                                            <span style={{
                                                wordBreak: 'break-word'
                                            }}>
                                                {q.question_text.length > 60
                                                    ? q.question_text.slice(0, 60) + '...'
                                                    : q.question_text
                                                }
                                            </span>
                                            <span
                                                className="text-muted"
                                                style={{
                                                    marginLeft: 'var(--space-sm)',
                                                    fontSize: 'var(--font-xs)'
                                                }}
                                            >
                                                ({q.question_type.toUpperCase()})
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(i)}
                                            className="btn btn-ghost"
                                            style={{
                                                color: 'var(--accent-danger)',
                                                minWidth: 'var(--touch-target)',
                                                padding: 'var(--space-sm)'
                                            }}
                                            aria-label={`Remove question ${i + 1}`}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="btn btn-primary btn-lg btn-block"
                        disabled={loading || examData.questions.length === 0 || !examData.title}
                        aria-busy={loading}
                        style={{ maxWidth: '400px' }}
                    >
                        {loading ? 'Creating Exam...' : 'Create Exam'}
                    </button>
                </form>
            </div>
        </main>
    );
}
