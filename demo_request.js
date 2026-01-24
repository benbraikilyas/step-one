const fetch = globalThis.fetch;

async function testBackend() {
    console.log(" Testing Backend API at http://localhost:3000/api/decision...");

    const payload = {
        answers: [
            "I am feeling overwhelmed by choices.",
            "I have a deadline tomorrow.",
            "I just want a simple task to start."
        ]
    };

    console.log(" Sending Payload:", JSON.stringify(payload, null, 2));

    try {
        const response = await fetch("http://localhost:3000/api/decision", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const status = response.status;
        console.log(`\n Status Code: ${status}`);

        if (status === 200) {
            const data = await response.json();
            console.log(" Success! AI Decision Received:");
            console.log("---------------------------------------------------");
            console.log(`SESSION ID: ${data.sessionId}`);
            console.log(`DECISION:   ${data.decision}`);
            console.log("---------------------------------------------------");
        } else {
            const errorText = await response.text();
            console.error(" Error Response:", errorText);
        }

    } catch (error) {
        console.error(" Failed to connect to backend. Is 'npm run dev' running on port 3000?");
        console.error(error);
    }
}

testBackend();
