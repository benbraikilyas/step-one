import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/db';
import DecisionSession from '../../models/Session';
import { generateDecision } from '../../lib/ai';
import { v4 as uuidv4 } from 'uuid';

type Data = {
    decision?: string;
    sessionId?: string;
    error?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    await dbConnect();

    try {
        const { answers, sessionId: clientSessionId } = req.body;

        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ error: 'Invalid answers provided' });
        }

        // Rate Limiting / Session Check
        let sessionId = clientSessionId;
        if (sessionId) {
            const existingSession = await DecisionSession.findOne({ sessionId });
            if (existingSession) {
                // If a decision was made less than 24 hours ago, return it (or block)
                // For this hackathon, we simply return the previous decision if it exists
                return res.status(200).json({
                    decision: existingSession.generatedDecision,
                    sessionId: existingSession.sessionId
                });
            }
        } else {
            sessionId = uuidv4();
        }

        // Generate Decision
        const decision = await generateDecision(answers);

        // Persist
        await DecisionSession.create({
            sessionId,
            answers,
            generatedDecision: decision,
        });

        return res.status(200).json({ decision, sessionId });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
