import { useState, useEffect, useRef } from 'react';

export default function VoiceControl({
    textToSpeak,
    autoSpeak = false,
    onSpeechResult
}) {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [supported, setSupported] = useState(true);
    const recognitionRef = useRef(null);
    const onSpeechResultRef = useRef(onSpeechResult);
    useEffect(() => {
        onSpeechResultRef.current = onSpeechResult;
    }, [onSpeechResult]);

    useEffect(() => {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setSupported(false);
            return;
        }

        // Initialize speech recognition
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const result = event.results[0][0].transcript;
            console.log('Voice recognized:', result);
            setTranscript(result);
            if (onSpeechResultRef.current) {
                onSpeechResultRef.current(result);
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []); // Only initialize once

    // Auto-speak when text changes
    useEffect(() => {
        if (autoSpeak && textToSpeak) {
            speak(textToSpeak);
        }
    }, [textToSpeak, autoSpeak]);

    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            // Stop any ongoing speech first
            window.speechSynthesis.cancel();
            setIsSpeaking(false);

            try {
                recognitionRef.current.start();
                setIsListening(true);
                setTranscript('');
            } catch (err) {
                console.error('Failed to start recognition:', err);
            }
        }
    };

    const speak = (text) => {
        if (!window.speechSynthesis || !text) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    if (!supported) {
        return (
            <div
                className="alert alert-info"
                role="status"
                style={{ marginBottom: 'var(--space-lg)' }}
            >
                <strong>Voice controls unavailable:</strong> Your browser doesn't support speech recognition.
                Please use Chrome, Edge, or Safari for voice features.
            </div>
        );
    }

    return (
        <div className="voice-controls" role="group" aria-label="Voice controls">
            {/* Speech-to-Text Button */}
            <button
                type="button"
                className={`voice-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleListening}
                aria-pressed={isListening}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                title={isListening ? 'Click to stop listening' : 'Click to speak your answer'}
            >
                <span aria-hidden="true">
                    {isListening ? '🔴' : '🎤'}
                </span>
                <span className="sr-only">
                    {isListening ? 'Listening... Click to stop' : 'Start voice input'}
                </span>
            </button>

            {/* Text-to-Speech Button */}
            <button
                type="button"
                className={`voice-btn ${isSpeaking ? 'speaking' : ''}`}
                onClick={() => isSpeaking ? stopSpeaking() : speak(textToSpeak)}
                aria-pressed={isSpeaking}
                aria-label={isSpeaking ? 'Stop reading' : 'Read question aloud'}
                title={isSpeaking ? 'Click to stop reading' : 'Click to hear the question'}
                disabled={!textToSpeak}
            >
                <span aria-hidden="true">
                    {isSpeaking ? '⏹️' : '🔊'}
                </span>
                <span className="sr-only">
                    {isSpeaking ? 'Stop reading' : 'Read question aloud'}
                </span>
            </button>

            {/* Status Indicator */}
            {isListening && (
                <div
                    className="flex items-center gap-sm"
                    role="status"
                    aria-live="polite"
                    style={{
                        padding: 'var(--space-sm) var(--space-md)',
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--border-radius)',
                        fontSize: 'var(--font-sm)',
                        color: 'var(--accent-primary)'
                    }}
                >
                    <span className="spinner" style={{ width: '16px', height: '16px' }}></span>
                    <span>Listening...</span>
                </div>
            )}

            {/* Transcript Display */}
            {transcript && !isListening && (
                <div
                    role="status"
                    aria-live="polite"
                    style={{
                        padding: 'var(--space-sm) var(--space-md)',
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--border-radius)',
                        fontSize: 'var(--font-sm)',
                        color: 'var(--text-secondary)',
                        flex: '1 1 100%'
                    }}
                >
                    <strong>You said:</strong> "{transcript}"
                </div>
            )}
        </div>
    );
}
