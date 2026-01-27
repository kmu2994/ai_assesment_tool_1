import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import VoiceControl from '../components/VoiceControl';

export default function ExamPage() {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [exam, setExam] = useState(null);
    const [submission, setSubmission] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [answeredQuestions, setAnsweredQuestions] = useState([]); // Track answered questions for navigation
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [finished, setFinished] = useState(false);
    const [results, setResults] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [error, setError] = useState('');

    useEffect(() => {
        startExam();
    }, [examId]);

    useEffect(() => {
        if (timeLeft <= 0 || finished) return;
        const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, finished]);

    // Auto-submit when time runs out
    useEffect(() => {
        if (timeLeft === 0 && !finished && submission) {
            finishExam();
        }
    }, [timeLeft]);

    const startExam = async () => {
        try {
            const data = await examsAPI.startExam(examId);
            setExam(data.exam);
            setSubmission({ id: data.submission_id });
            setCurrentQuestion(data.first_question);
            setAnsweredQuestions([{ question: data.first_question, answer: null, feedback: null }]);
            setTimeLeft(data.duration_minutes * 60);
        } catch (err) {
            console.error('Failed to start exam:', err);
            setError('Failed to start exam. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitAnswer = async () => {
        if (!selectedAnswer || submitting || feedback) return;
        setSubmitting(true);
        setError('');

        try {
            const result = await examsAPI.submitAnswer(
                submission.id,
                currentQuestion.id,
                selectedAnswer
            );
            setFeedback(result);

            // Update the answered questions array
            setAnsweredQuestions(prev => {
                const updated = [...prev];
                updated[questionIndex] = {
                    question: currentQuestion,
                    answer: selectedAnswer,
                    feedback: result
                };
                return updated;
            });
        } catch (err) {
            console.error('Failed to submit:', err);
            setError('Failed to submit answer. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSkip = async () => {
        setSubmitting(true);
        setError('');

        try {
            const result = await examsAPI.submitAnswer(
                submission.id,
                currentQuestion.id,
                null // Skip
            );

            // Update answered questions
            setAnsweredQuestions(prev => {
                const updated = [...prev];
                updated[questionIndex] = {
                    question: currentQuestion,
                    answer: null,
                    feedback: result
                };
                return updated;
            });

            if (result.exam_complete || !result.next_question) {
                finishExam();
            } else {
                // Add next question
                setAnsweredQuestions(prev => [...prev, { question: result.next_question, answer: null, feedback: null }]);
                setQuestionIndex(i => i + 1);
                setCurrentQuestion(result.next_question);
                setSelectedAnswer('');
                setFeedback(null);
            }
        } catch (err) {
            console.error('Failed to skip:', err);
            setError('Failed to skip question.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleNextQuestion = async () => {
        if (!feedback) {
            // If not submitted, skip
            await handleSkip();
            return;
        }

        if (feedback.exam_complete || !feedback.next_question) {
            finishExam();
        } else {
            // Add next question if not already present
            if (questionIndex + 1 >= answeredQuestions.length) {
                setAnsweredQuestions(prev => [...prev, { question: feedback.next_question, answer: null, feedback: null }]);
            }
            setQuestionIndex(i => i + 1);
            setCurrentQuestion(feedback.next_question);
            setSelectedAnswer('');
            setFeedback(null);
        }
    };

    const handlePreviousQuestion = () => {
        if (questionIndex > 0) {
            const prevData = answeredQuestions[questionIndex - 1];
            setQuestionIndex(questionIndex - 1);
            setCurrentQuestion(prevData.question);
            setSelectedAnswer(prevData.answer || '');
            setFeedback(prevData.feedback);
        }
    };

    const finishExam = async () => {
        try {
            const result = await examsAPI.finishExam(submission.id);
            setResults(result);
            setFinished(true);
        } catch (err) {
            console.error('Failed to finish:', err);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Loading state
    if (loading) {
        return (
            <div className="loading-overlay" aria-live="polite" aria-busy="true">
                <div className="spinner" role="status">
                    <span className="sr-only">Loading exam...</span>
                </div>
            </div>
        );
    }

    // Results screen
    if (finished && results) {
        return (
            <main id="main-content" className="page">
                <div className="container container-narrow">
                    <article
                        className="results-card"
                        aria-labelledby="results-title"
                    >
                        <h1 id="results-title">🎉 Exam Complete!</h1>

                        <div
                            className="results-score"
                            aria-label={`Your score: ${results.percentage.toFixed(1)} percent`}
                        >
                            {results.percentage.toFixed(1)}%
                        </div>

                        <p className="results-grade">
                            Grade: <strong>{results.grade}</strong>
                        </p>

                        <div className="results-stats">
                            <div>
                                <strong className="text-success">
                                    {results.correct_answers}
                                </strong>
                                <span className="text-secondary"> Correct</span>
                            </div>
                            <div>
                                <strong className="text-danger">
                                    {results.questions_answered - results.correct_answers}
                                </strong>
                                <span className="text-secondary"> Incorrect</span>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary btn-lg btn-block"
                            onClick={() => navigate('/dashboard')}
                            aria-label="Return to your dashboard"
                        >
                            Back to Dashboard
                        </button>
                    </article>
                </div>
            </main>
        );
    }

    // Exam interface
    return (
        <main
            id="main-content"
            className="page"
            style={{ paddingBottom: '120px' }} // Space for mobile nav
        >
            <div className="exam-container">
                {/* Exam Header */}
                <header className="exam-header">
                    <div className="exam-header-info">
                        <h1 style={{ fontSize: 'var(--font-xl)', marginBottom: '0' }}>
                            {exam?.title}
                        </h1>
                        <p className="text-secondary">
                            Question {questionIndex + 1} of {exam?.total_questions || 20}
                        </p>
                    </div>

                    <div
                        className={`exam-header-timer ${timeLeft < 60 ? 'warning' : ''}`}
                        role="timer"
                        aria-live="polite"
                        aria-label={`Time remaining: ${formatTime(timeLeft)}`}
                    >
                        ⏱️ {formatTime(timeLeft)}
                    </div>
                </header>

                {/* Progress Bar */}
                <div
                    className="progress-bar"
                    role="progressbar"
                    aria-valuenow={questionIndex + 1}
                    aria-valuemin="1"
                    aria-valuemax={exam?.total_questions || 20}
                    aria-label={`Progress: Question ${questionIndex + 1} of ${exam?.total_questions || 20}`}
                >
                    <div
                        className="progress-fill"
                        style={{
                            width: `${((questionIndex + 1) / (exam?.total_questions || 20)) * 100}%`
                        }}
                    />
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="alert alert-error" role="alert">
                        {error}
                    </div>
                )}

                {/* Question Card */}
                {currentQuestion && (
                    <article
                        className="question-card"
                        aria-labelledby="question-text"
                    >
                        {/* Voice Controls for Accessibility */}
                        <div className="voice-controls">
                            <VoiceControl
                                textToSpeak={currentQuestion.question_text}
                                autoSpeak={user?.accessibility_mode}
                                onSpeechResult={(text) => {
                                    const cleanText = text.toLowerCase().trim();
                                    if (currentQuestion.question_type === 'mcq') {
                                        if (cleanText.includes('option a') || cleanText === 'a' || cleanText.endsWith(' a')) setSelectedAnswer('A');
                                        else if (cleanText.includes('option b') || cleanText === 'b' || cleanText.endsWith(' b')) setSelectedAnswer('B');
                                        else if (cleanText.includes('option c') || cleanText === 'c' || cleanText.endsWith(' c')) setSelectedAnswer('C');
                                        else if (cleanText.includes('option d') || cleanText === 'd' || cleanText.endsWith(' d')) setSelectedAnswer('D');
                                    } else {
                                        setSelectedAnswer(text);
                                    }
                                }}
                            />
                        </div>

                        {/* Question Text */}
                        <p
                            id="question-text"
                            className="question-text"
                        >
                            {currentQuestion.question_text}
                        </p>

                        {/* MCQ Options */}
                        {currentQuestion.question_type === 'mcq' && currentQuestion.options && (
                            <div
                                role="radiogroup"
                                aria-label="Answer options"
                            >
                                {Object.entries(currentQuestion.options).map(([key, value]) => (
                                    <button
                                        key={key}
                                        role="radio"
                                        aria-checked={selectedAnswer === key}
                                        className={`option-btn 
                                            ${selectedAnswer === key ? 'selected' : ''} 
                                            ${feedback && key === selectedAnswer
                                                ? (feedback.is_correct ? 'correct' : 'incorrect')
                                                : ''
                                            }`}
                                        onClick={() => !feedback && setSelectedAnswer(key)}
                                        disabled={!!feedback}
                                        aria-label={`Option ${key}: ${value}`}
                                    >
                                        <span className="option-label">{key}</span>
                                        <span>{value}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Descriptive Answer */}
                        {currentQuestion.question_type === 'descriptive' && (
                            <div>
                                <label
                                    htmlFor="answer-input"
                                    className="sr-only"
                                >
                                    Your answer
                                </label>
                                <textarea
                                    id="answer-input"
                                    className="textarea"
                                    rows={5}
                                    value={selectedAnswer}
                                    onChange={(e) => setSelectedAnswer(e.target.value)}
                                    placeholder="Type your answer here..."
                                    disabled={!!feedback}
                                    aria-describedby={feedback ? 'feedback-message' : undefined}
                                />
                            </div>
                        )}

                        {/* Feedback Alert */}
                        {feedback && (
                            <div
                                id="feedback-message"
                                className={`alert ${feedback.is_correct ? 'alert-success' : 'alert-error'}`}
                                role="alert"
                                aria-live="assertive"
                            >
                                <strong>
                                    {feedback.is_correct ? '✓ Correct!' : '✗ Incorrect'}
                                </strong>
                                <span> {feedback.feedback}</span>
                                {feedback.similarity && (
                                    <span> (Similarity: {(feedback.similarity * 100).toFixed(1)}%)</span>
                                )}
                            </div>
                        )}

                        {/* Desktop Action Buttons */}
                        <div className="exam-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                            {/* Previous Button */}
                            <button
                                className="btn btn-ghost"
                                onClick={handlePreviousQuestion}
                                disabled={questionIndex === 0 || submitting}
                                style={{ flex: 1 }}
                            >
                                ← Previous
                            </button>

                            {/* Skip Button */}
                            {!feedback && (
                                <button
                                    className="btn btn-ghost"
                                    onClick={handleSkip}
                                    disabled={submitting}
                                    style={{ flex: 1 }}
                                >
                                    {submitting ? 'Skipping...' : 'Skip'}
                                </button>
                            )}

                            {/* Submit Button */}
                            {!feedback && (
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSubmitAnswer}
                                    disabled={!selectedAnswer || submitting}
                                    aria-busy={submitting}
                                    style={{ flex: 2 }}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Answer'}
                                </button>
                            )}

                            {/* Next Button */}
                            {feedback && (
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleNextQuestion}
                                    disabled={submitting}
                                    style={{ flex: 2 }}
                                >
                                    {feedback.exam_complete ? 'Finish Exam' : 'Next Question →'}
                                </button>
                            )}
                        </div>
                    </article>
                )}
            </div>

            {/* Fixed Mobile Navigation */}
            <nav
                className="exam-nav-mobile"
                aria-label="Exam navigation"
                style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}
            >
                <button
                    className="btn btn-ghost"
                    onClick={handlePreviousQuestion}
                    disabled={questionIndex === 0 || submitting}
                >
                    ← Prev
                </button>

                {!feedback ? (
                    <>
                        <button
                            className="btn btn-ghost"
                            onClick={handleSkip}
                            disabled={submitting}
                        >
                            Skip
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSubmitAnswer}
                            disabled={!selectedAnswer || submitting}
                        >
                            Submit
                        </button>
                    </>
                ) : (
                    <button
                        className="btn btn-primary"
                        onClick={handleNextQuestion}
                        disabled={submitting}
                    >
                        {feedback.exam_complete ? 'Finish' : 'Next →'}
                    </button>
                )}
            </nav>

            {/* Mobile nav styles */}
            <style>{`
                .exam-nav-mobile {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 1rem;
                    background: var(--bg-secondary);
                    border-top: 1px solid var(--border-color);
                }
                @media (min-width: 768px) {
                    .exam-nav-mobile {
                        display: none !important;
                    }
                }
            `}</style>
        </main>
    );
}
