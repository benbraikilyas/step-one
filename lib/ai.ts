import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
    console.warn("GOOGLE_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "mock-key");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const SYSTEM_PROMPT = `
You are a Decision Compressor. 
Your only job is to take a set of answers and output ONE clear, low-risk, practical action for the next 7-10 days. 
No fluff. No therapy speak. No preamble. No emotional validation.
Output STRICT JSON only: { "action": "..." }
`.trim();

export async function generateDecision(answers: string[]): Promise<string> {
    if (!API_KEY) {
        // Return a mock response if no key is present (useful for judging if key is missing)
        return "Mock Decision: Take a 10-minute walk outside without your phone.";
    }

    try {
        const userPrompt = `User Answers:\n${answers.map((a, i) => `${i + 1}. ${a}`).join('\n')}`;

        const result = await model.generateContent({
            contents: [
                { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                { role: "user", parts: [{ text: userPrompt }] }
            ],
            generationConfig: {
                maxOutputTokens: 100,
                temperature: 0.2, // Low temperature for deterministic, less "creative" output
            }
        });

        const response = result.response;
        const text = response.text();

        // Attempt to parse JSON to ensure strict adherence
        const CleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(CleanText);
        return parsed.action;
    } catch (error) {
        console.error("AI Generation Error:", error);
        // Fallback in case of failure
        return "Commit to one small task today that you've been putting off.";
    }
}
