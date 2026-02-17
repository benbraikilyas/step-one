import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import dbConnect from '../../lib/db';
import User from '../../models/User';
import DailyStep from '../../models/DailyStep';
import { generateDailyQuestions } from '../../lib/ai';

type Data = {
    questions?: string[];
    dayNumber?: number;
    hasCompletedProgram?: boolean;
    error?: string;
};

/**
 * Get today's date as UTC string
 */
function getTodayUTC(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Get yesterday's date as UTC string
 */
function getYesterdayUTC(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
}

// Simple in-memory cache for "forced" requests to avoid hammering AI during testing
const forcedCache = new Map<string, { questions: string[], expires: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Calculate user's current day number (1-7) based on consecutive completion
 */
async function calculateDayNumber(userId: string): Promise<number> {
    const yesterday = getYesterdayUTC();

    // Get yesterday's step to check for streak
    const yesterdayStep = await DailyStep.findOne({ userId, date: yesterday });

    if (!yesterdayStep) {
        // No step yesterday = start fresh at Day 1
        return 1;
    }

    // Yesterday's dayNumber + 1 (max 7)
    return Math.min(yesterdayStep.dayNumber + 1, 7);
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await dbConnect();
    } catch {
        console.warn("⚠️ DB connection failed. Proceeding...");
    }

    // Require authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user has completed the 7-day program
        if (user.hasCompletedProgram) {
            return res.status(200).json({
                questions: ["What is one way you can carry this clarity with you into the next week?"],
                dayNumber: 7,
                hasCompletedProgram: true
            });
        }

        const today = getTodayUTC();

        // Allow forcing day for testing (check BEFORE cache)
        const forceToDay = req.query.forceToDay;
        const isForcing = forceToDay && typeof forceToDay === 'string';

        if (isForcing) {
            const forced = parseInt(forceToDay as string);
            if (forced === 8) {
                return res.status(200).json({
                    questions: ["Congratulations on completing the program."],
                    dayNumber: 7,
                    hasCompletedProgram: true
                });
            }
        }

        // Check if user already has today's step (skip if forcing a day)
        if (!isForcing) {
            const todayStep = await DailyStep.findOne({ userId: user._id, date: today });
            if (todayStep) {
                // Return the questions they already got
                return res.status(200).json({
                    questions: todayStep.questions,
                    dayNumber: todayStep.dayNumber,
                    hasCompletedProgram: false
                });
            }
        }

        // Calculate current day number (1-7)
        let dayNumber = await calculateDayNumber(user._id);

        // Apply forced day if testing
        if (isForcing) {
            const forced = parseInt(forceToDay as string);
            if (!isNaN(forced) && forced >= 1 && forced <= 7) {
                dayNumber = forced;

                // Check cache for forced requests
                const cacheKey = `${user._id}_${dayNumber}`;
                const cached = forcedCache.get(cacheKey);
                if (cached && cached.expires > Date.now()) {
                    return res.status(200).json({
                        questions: cached.questions,
                        dayNumber,
                        hasCompletedProgram: false
                    });
                }
            }
        }

        // Get previous steps for context (last 6 days)
        const previousSteps = await DailyStep.find({ userId: user._id })
            .sort({ date: -1 })
            .limit(6)
            .select('content answers');

        // Generate AI questions for this day
        const questions = await generateDailyQuestions(
            dayNumber,
            previousSteps.reverse() // Oldest to newest
        );

        // Cache forced results
        if (isForcing && dayNumber >= 1 && dayNumber <= 7) {
            forcedCache.set(`${user._id}_${dayNumber}`, {
                questions,
                expires: Date.now() + CACHE_TTL
            });
        }

        return res.status(200).json({
            questions,
            dayNumber,
            hasCompletedProgram: false
        });

    } catch (error) {
        console.error("❌ Error generating questions:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
