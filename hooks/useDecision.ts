import { useState } from 'react';

interface UseDecisionResult {
    loading: boolean;
    error: string | null;
    decision: string | null;
    submitAnswers: (answers: string[]) => Promise<void>;
}

export function useDecision(): UseDecisionResult {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [decision, setDecision] = useState<string | null>(null);

    const submitAnswers = async (answers: string[]) => {
        setLoading(true);
        setError(null);
        try {
            // Check for existing session in localStorage
            const storedSessionId = localStorage.getItem('decision_session_id');

            const res = await fetch('/api/decision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers, sessionId: storedSessionId }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            setDecision(data.decision);
            if (data.sessionId) {
                localStorage.setItem('decision_session_id', data.sessionId);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, decision, submitAnswers };
}
