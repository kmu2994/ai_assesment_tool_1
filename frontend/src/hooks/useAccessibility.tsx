import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';

interface AccessibilityContextType {
    textToSpeech: boolean;
    highContrast: boolean;
    toggleTextToSpeech: () => void;
    toggleHighContrast: () => void;
    speak: (text: string) => void;
    stopSpeaking: () => void;
    isRivaEnabled: boolean;
    setIsRivaEnabled: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
    const [textToSpeech, setTextToSpeech] = useState(() => {
        return localStorage.getItem('textToSpeech') === 'true';
    });

    const [highContrast, setHighContrast] = useState(() => {
        return localStorage.getItem('highContrast') === 'true';
    });

    // Apply high contrast class to root
    useEffect(() => {
        const root = document.documentElement;
        if (highContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }
        localStorage.setItem('highContrast', String(highContrast));
    }, [highContrast]);

    // Save text-to-speech preference
    useEffect(() => {
        localStorage.setItem('textToSpeech', String(textToSpeech));
    }, [textToSpeech]);

    const toggleTextToSpeech = () => {
        setTextToSpeech(prev => !prev);
    };

    const toggleHighContrast = () => {
        setHighContrast(prev => !prev);
    };

    const [isRivaEnabled, setIsRivaEnabled] = useState(false);

    const speak = useCallback(async (text: string) => {
        if (!textToSpeech) return;

        // Try NVIDIA Riva via backend if enabled/available
        if (isRivaEnabled) {
            try {
                const response = await fetch('/api/accessibility/speak', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    },
                    body: JSON.stringify({ text })
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const audio = new Audio(url);
                    audio.play();
                    return;
                }
            } catch (e) {
                console.error("Riva TTS failed, falling back to browser.", e);
            }
        }

        // Browser Fallback
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }, [textToSpeech, isRivaEnabled]);

    const stopSpeaking = useCallback(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }, []);

    return (
        <AccessibilityContext.Provider
            value={{
                textToSpeech,
                highContrast,
                toggleTextToSpeech,
                toggleHighContrast,
                speak,
                stopSpeaking,
                isRivaEnabled,
                setIsRivaEnabled
            }}
        >
            {children}
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (context === undefined) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }
    return context;
}
