import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
    console.warn("GOOGLE_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "mock-key");
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

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPT,
});

const decisionModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `
You are a supportive, clear-thinking guide.
Your goal is to synthesize the user's reflections into ONE clear, simple, low-risk action they can take right now.
Rules:
- Output ONLY the action sentence.
- No explanations, no preamble.
- Keep it under 20 words.
- Start with a verb.
    `.trim(),
});

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

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: userPrompt }],
                },
            ],
            generationConfig: {
                maxOutputTokens: 60,
                temperature: 0.5,
            },
        });

        return result.response.text().trim();
    } catch (error) {
        console.error("AI Generation Error:", error);
        return "What feels unclear for you right now?";
    }
}

export async function generateDecision(answers: string[]): Promise<string> {
    if (!API_KEY) {
        return "Take a 5-minute walk without your phone.";
    }

    const userPrompt = `
User Answers:
${answers.map((a, i) => `${i + 1}: ${a}`).join("\n")}
    `.trim();

    try {
        const result = await decisionModel.generateContent({
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: {
                maxOutputTokens: 100,
                temperature: 0.3,
            },
        });
        return result.response.text().trim();
    } catch (error) {
        console.error("AI Decision Error:", error);
        return "Rest for 10 minutes, then reconsider.";
    }
}
