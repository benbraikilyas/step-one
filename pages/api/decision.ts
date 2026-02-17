import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import dbConnect from '../../lib/db';
import User from '../../models/User';
import DailyStep from '../../models/DailyStep';
import DecisionSession from '../../models/Session';
import { generateDecision } from '../../lib/ai';
import { v4 as uuidv4 } from 'uuid';

type Data = {
    decision?: string;
    sessionId?: string;
    error?: string;
    alreadyCompletedToday?: boolean;
    isGraduating?: boolean;
};

/**
 * Get today's date as UTC string in YYYY-MM-DD format
 * Timezone-safe: all users normalized to UTC day boundaries
 */
function getTodayUTC(): string {
    return new Date().toISOString().split('T')[0];
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await dbConnect();
    } catch {
        console.warn("⚠️ Initial DB connection failed (Dev Mode). Proceeding...");
    }

    // Get authenticated user session
    const session = await getServerSession(req, res, authOptions);

    try {
        const { answers, sessionId: clientSessionId } = req.body;

        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ error: 'Invalid answers provided' });
        }

        let sessionId = clientSessionId;

        // === AUTHENTICATED USER FLOW ===
        if (session?.user?.email) {
            try {
                const user = await User.findOne({ email: session.user.email });

                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }

                const todayUTC = getTodayUTC();

                // Check for existing daily step (indexed query - O(1))
                const existingStep = await DailyStep.findOne({
                    userId: user._id,
                    date: todayUTC
                });

                if (existingStep) {
                    console.log(`✅ User ${session.user.email} already has step for ${todayUTC}`);
                    return res.status(200).json({
                        decision: existingStep.content,
                        sessionId: existingStep.sessionId,
                        alreadyCompletedToday: true
                    });
                }

                // Get questions and dayNumber from request (should be fetched from /api/questions first)
                const { questions, dayNumber } = req.body;

                if (!questions || !Array.isArray(questions)) {
                    return res.status(400).json({ error: 'Questions must be provided' });
                }

                if (!dayNumber || dayNumber < 1 || dayNumber > 7) {
                    return res.status(400).json({ error: 'Invalid day number' });
                }

                // Generate new decision
                sessionId = uuidv4();
                const decision = await generateDecision(answers, dayNumber);

                // Atomic insert with race condition handling
                try {
                    await DailyStep.create({
                        userId: user._id,
                        date: todayUTC,
                        content: decision,
                        sessionId,
                        dayNumber,
                        questions,
                        answers,
                        completed: true
                    });

                    console.log(`✅ Created daily step for ${session.user.email} on ${todayUTC} (Day ${dayNumber})`);

                    // Check if user just completed Day 7
                    if (dayNumber === 7 && !user.hasCompletedProgram) {
                        await User.findByIdAndUpdate(user._id, {
                            hasCompletedProgram: true,
                            programCompletedAt: new Date()
                        });
                        console.log(`🎉 User ${session.user.email} completed 7-day program!`);
                    }

                    // Persist DecisionSession for backup/analytics (non-critical)
                    await DecisionSession.create({
                        sessionId,
                        answers,
                        generatedDecision: decision
                    }).catch(err => console.warn(' DecisionSession save failed:', err));

                    return res.status(200).json({
                        decision,
                        sessionId,
                        isGraduating: dayNumber === 7
                    });

                } catch (error: unknown) {
                    const err = error as { code?: number };
                    // Race condition: duplicate key (another request won)
                    if (err.code === 11000) {
                        console.log(`🔄 Race condition detected for ${session.user.email} - fetching winner's step`);
                        const winningStep = await DailyStep.findOne({
                            userId: user._id,
                            date: todayUTC
                        });

                        if (winningStep) {
                            return res.status(200).json({
                                decision: winningStep.content,
                                sessionId: winningStep.sessionId,
                                alreadyCompletedToday: true
                            });
                        }
                    }
                    throw error;
                }

            } catch (dbError) {
                console.error("❌ Database error in authenticated flow:", dbError);
                // Fall through to anonymous flow as graceful degradation
            }
        }

        // === ANONYMOUS USER FLOW (session-based caching) ===
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
        } catch {
            console.warn("⚠️ Session check failed (Dev Mode). Proceeding with generation...");
        }

        if (!sessionId) {
            sessionId = uuidv4();
        }

        // Generate Decision for anonymous user
        const decision = await generateDecision(answers);

        // Persist session
        try {
            await DecisionSession.create({
                sessionId,
                answers,
                generatedDecision: decision,
            });
        } catch {
            console.warn("⚠️ DecisionSession save failed. Returning decision without persistence.");
        }

        return res.status(200).json({ decision, sessionId });

    } catch (error) {
        console.error("❌ Unhandled error:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
