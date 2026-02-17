import { useState } from 'react';

interface UseDecisionResult {
    loading: boolean;
    error: string | null;
    decision: string | null;
    alreadyCompletedToday: boolean;
    isGraduating: boolean;
    submitAnswers: (answers: string[], questions: string[], dayNumber: number) => Promise<unknown>;
}

export function useDecision(): UseDecisionResult {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [decision, setDecision] = useState<string | null>(null);
    const [alreadyCompletedToday, setAlreadyCompletedToday] = useState(false);
    const [isGraduating, setIsGraduating] = useState(false);

    const submitAnswers = async (answers: string[], questions: string[], dayNumber: number) => {
        setLoading(true);
        setError(null);
        try {
            // Check for existing session in localStorage
            const storedSessionId = localStorage.getItem('decision_session_id');

            const res = await fetch('/api/decision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    answers,
                    questions,
                    dayNumber,
                    sessionId: storedSessionId
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            setDecision(data.decision);
            setAlreadyCompletedToday(data.alreadyCompletedToday || false);
            setIsGraduating(data.isGraduating || false);

            if (data.sessionId) {
                localStorage.setItem('decision_session_id', data.sessionId);
            }

            return data;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Something went wrong';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, decision, alreadyCompletedToday, isGraduating, submitAnswers };
}
