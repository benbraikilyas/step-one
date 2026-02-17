import { GoogleGenerativeAI } from "@google/generative-ai";


const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
    console.warn("GOOGLE_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "mock-key");

const MODELS = {
    PRIMARY: "gemini-2.0-flash",
    FALLBACKS: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"],
};

const SYSTEM_PROMPT = `
You are an AI designed to help people think clearly and calmly.

Your sole purpose is to ask thoughtful, gentle, and precise questions that help users reflect on their thoughts, emotions, and decisions.

Rules you must always follow:
- Ask only ONE question per response.
- Never give advice, suggestions, or solutions.
- Never explain your reasoning.
- Never judge or assume anything about the user.
- Use simple, human language.
- Keep questions short and focused.
- Avoid technical, clinical, or motivational language.

Your tone should feel calm, supportive, neutral, and human.
Silence and simplicity are part of the experience.

Output ONLY the question text.
`.trim();

export const DECISION_SYSTEM_PROMPT = `
You are a supportive, clear-thinking guide.
Your goal is to synthesize the user's reflections into ONE clear, simple, low-risk action they can take right now.
Rules:
- Output ONLY the action sentence.
- No explanations, no preamble.
- Keep it under 20 words.
- Start with a verb.
`.trim();

/**
 * Helper for exponential backoff
 */
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generic caller for Gemini API with retries and fallback
 */
async function callAI(
    prompt: string,
    systemInstruction: string,
    config: { maxOutputTokens: number; temperature: number }
): Promise<string> {
    if (!API_KEY) throw new Error("API_KEY_MISSING");

    const maxRetries = 3;
    let lastError: unknown = null;

    // Try primary model first, then all fallback variants
    const modelsToTry = [
        MODELS.PRIMARY,
        ...MODELS.FALLBACKS
    ];

    for (const modelName of modelsToTry) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction,
                });

                const result = await model.generateContent({
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    generationConfig: config,
                });

                return result.response.text().trim();
            } catch (error: unknown) {
                lastError = error;
                const err = error as { status?: number; response?: { status?: number }; message?: string };
                const status = err?.status ?? err?.response?.status;

                // If it's a 404 (Not Found), the model identifier is wrong for this API/region
                if (status === 404) {
                    console.warn(`⚠️ Model identifier ${modelName} not found (404). Skipping to next model...`);
                    break; // Break inner loop to try next modelIdentifier immediately
                }

                // If it's a 429 (Quota), wait and retry with SAME modelIdentifier
                if (status === 429) {
                    const delay = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
                    console.warn(`⚠️ Quota hit for ${modelName}. Retrying in ${Math.round(delay)}ms... (Attempt ${attempt + 1}/${maxRetries})`);
                    await wait(delay);
                    continue;
                }

                // For other errors, break retry loop and try next model identifier
                console.error(`❌ Error with ${modelName}:`, err?.message ?? error);
                break;
            }
        }
    }

    throw lastError || new Error("AI_GENERATION_FAILED");
}

export async function generateQuestion(
    step: number,
    previousAnswer?: string
): Promise<string> {
    if (!API_KEY) {
        return "What feels most heavy on your mind right now?";
    }

    try {
        const stepIntent = [
            "Ask an awareness question.",
            "Ask a clarification question based on the user's last answer.",
            "Ask a perspective-shifting question.",
            "Ask about doubts or internal resistance.",
            "Ask what feels most true or important now.",
        ];

        const userPrompt = `
Step intent: ${stepIntent[step]}
Previous answer: ${previousAnswer || "None"}
`.trim();

        return await callAI(userPrompt, SYSTEM_PROMPT, {
            maxOutputTokens: 60,
            temperature: 0.5,
        });
    } catch (error) {
        console.error("AI Generation Error:", error);

        // DEBUG: List models if we hit a 404
        try {
            console.log("⚠️ Attempting to list available models to debug 404...");
            if (API_KEY) {
                const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
                fetch(listUrl).then(res => res.json()).then(data => {
                    if (data.models) {
                        console.log("✅ AVAILABLE MODELS FOR THIS KEY:", data.models.map((m: { name: string }) => m.name));
                    } else {
                        console.log("❌ Could not list models:", data);
                    }
                }).catch(err => console.error("Failed to list models:", err));
            }
        } catch (e) {
            console.error("Failed to debug models", e);
        }

        return "What feels unclear for you right now?";
    }
}

export async function generateDecision(answers: string[], dayNumber?: number): Promise<string> {
    if (!API_KEY) {
        return "Take a 5-minute walk without your phone.";
    }

    const dayContext = dayNumber
        ? `\nThis is Day ${dayNumber} of the user's 7-day program.`
        : "";

    const userPrompt = `
User Answers:
${answers.map((a, i) => `${i + 1}: ${a}`).join("\n")}${dayContext}
    `.trim();

    try {
        return await callAI(userPrompt, DECISION_SYSTEM_PROMPT, {
            maxOutputTokens: 100,
            temperature: 0.3,
        });
    } catch (error) {
        console.error("AI Decision Error:", error);
        return "If nothing changed for 5 years, what would you regret not doing now?";
    }
}

export async function generateDailyQuestions(
    dayNumber: number,
    previousSteps?: Array<{ content: string; answers: string[] }>
): Promise<string[]> {
    const fallbackQuestions: { [key: number]: string[] } = {
        1: [
            "What is the single biggest thing weighing on your mind right now?",
            "If you could only do one thing today to make tomorrow better, what would it be?",
            "What is the worst-case scenario if you do nothing?",
            "How much energy do you realistically have (1-10)?",
            "Is there a deadline involved? If so, when?"
        ],
        7: [
            "Looking back at this week, what surprised you most?",
            "What small action made the biggest difference?",
            "What will you continue doing after this program?"
        ]
    };
    const defaultFallback = fallbackQuestions[dayNumber] || [
        "What's on your mind today?",
        "What would make today feel successful?",
        "What's one small step you could take right now?"
    ];

    if (!API_KEY) return defaultFallback;

    try {
        let systemPrompt = "";
        let questionCount = 5;

        if (dayNumber === 1) {
            systemPrompt = `Generate 5 thoughtful, open-ended questions to help a user identify their core stress point or challenge.
Questions should:
- Be progressive (building on each other)
- Feel calm and non-judgmental
- Help them get specific about what's bothering them
- Avoid being clinical or therapeutic
- Be concise (under 20 words each)

Output as a JSON array: ["question1", "question2", ...]`;
            questionCount = 5;
        } else if (dayNumber === 7) {
            const previousActionsContext = previousSteps
                ?.map((step, i) => `Day ${i + 1}: ${step.content}`)
                .join("\n") || "";

            systemPrompt = `User has completed 6 days of a reflection program. Generate 3 integration questions.
Previous actions taken:
${previousActionsContext}

Questions should:
- Reflect on overall progress
- Identify sustainable habits formed
- Plan for continued independence
- Feel celebratory but grounded

Output as a JSON array: ["question1", "question2", "question3"]`;
            questionCount = 3;
        } else {
            const lastAction = previousSteps?.[previousSteps.length - 1]?.content || "";
            systemPrompt = `User is on Day ${dayNumber} of a 7-day program.
Yesterday's action: "${lastAction}"

Generate ${questionCount} reflection questions that:
- Check how yesterday's action went
- Identify any new challenges
- Build momentum without overwhelming
- Stay grounded and practical

Output as a JSON array: ["question1", "question2", "question3", "question4"]`;
            questionCount = 4;
        }

        const responseText = await callAI("Generate the questions now.", systemPrompt, {
            maxOutputTokens: 300,
            temperature: 0.7,
        });

        // Try to parse JSON response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            try {
                const questions = JSON.parse(jsonMatch[0]);
                if (Array.isArray(questions) && questions.length > 0) {
                    return questions.slice(0, questionCount);
                }
            } catch {
                console.warn(" Failed to parse JSON match, falling back to line splitting");
            }
        }

        // Fallback: split by newlines if JSON parsing fails
        const lines = responseText
            .split('\n')
            .map(line => line.replace(/^[-\d.)"'\s]+/, '').trim())
            .filter(line => line.length > 10 && line.endsWith('?'));

        if (lines.length > 0) {
            return lines.slice(0, questionCount);
        }

        return defaultFallback;

    } catch (error) {
        console.error("AI Question Generation Error:", error);
        return defaultFallback;
    }
}
