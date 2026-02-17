const fs = require('fs');
const path = require('path');

// Manually read .env.local
const envPath = path.join(__dirname, '.env.local');
let apiKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GOOGLE_API_KEY=(.*)/);
    if (match && match[1]) {
        apiKey = match[1].trim();
    }
} catch (e) {
    console.error("Could not read .env.local");
}

if (!apiKey) {
    console.error("❌ No GOOGLE_API_KEY found in .env.local");
    process.exit(1);
}

console.log("Checking models using API Key ending in...", apiKey.slice(-4));

async function listModels() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("❌ API Error:", JSON.stringify(data.error, null, 2));
        } else if (data.models) {
            console.log("✅ Available Models:");
            data.models.forEach(m => {
                // Filter for models that support generateContent
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name.replace('models/', '')}`);
                }
            });
        } else {
            console.log("⚠️ No models returned or unexpected format:", data);
        }

    } catch (error) {
        console.error("❌ Script Error:", error);
    }
}

listModels();
