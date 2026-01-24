import emailjs from '@emailjs/nodejs';

export async function sendWelcomeEmail(to: string, name: string) {
    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;

    if (!serviceId || !templateId || !publicKey || !privateKey) {
        console.warn("⚠️ EmailJS Credentials missing. Skipping email send.");
        console.log(`[MOCK EMAIL] To: ${to}, Subject: Welcome to Decision Recovery`);
        return;
    }

    try {
        await emailjs.send(
            serviceId,
            templateId,
            {
                to_email: to,
                to_name: name,
                message: "Welcome to Decision Recovery. One decision per day.",
            },
            {
                publicKey: publicKey,
                privateKey: privateKey, // Required for server-side
            }
        );
        console.log(`✅ Welcome email sent to ${to} via EmailJS`);
    } catch (error) {
        console.error("❌ Failed to send email via EmailJS:", error);
    }
}
