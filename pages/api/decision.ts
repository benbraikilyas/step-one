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

    try {
        await dbConnect();
    } catch (e) {
        console.warn("⚠️ Initial DB connection failed (Dev Mode). Proceeding...");
    }

    try {
        const { answers, sessionId: clientSessionId } = req.body;

        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ error: 'Invalid answers provided' });
        }

        // Rate Limiting / Session Check
        let sessionId = clientSessionId;

        try {
            if (sessionId) {
                const existingSession = await DecisionSession.findOne({ sessionId });
                if (existingSession) {
                    return res.status(200).json({
                        decision: existingSession.generatedDecision,
                        sessionId: existingSession.sessionId
                    });
                }
            }
        } catch (dbError) {
            console.warn("⚠️ Database check failed (Dev Mode). Skipping session check.");
        }

        if (!sessionId) {
            sessionId = uuidv4();
        }

        // Generate Decision
        const decision = await generateDecision(answers);

        // Persist
        try {
            await DecisionSession.create({
                sessionId,
                answers,
                generatedDecision: decision,
            });
        } catch (dbError) {
            console.warn("⚠️ Database save failed (Dev Mode). Returning decision without persistence.");
        }

        return res.status(200).json({ decision, sessionId });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
