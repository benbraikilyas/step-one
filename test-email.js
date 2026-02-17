const emailjs = require('@emailjs/nodejs');

async function test() {
    console.log('Testing email sending with provided keys...');
    // Keys from .env.local
    const serviceId = 'service_hmfnqb7';
    const templateId = 'IeA0Et1BmdXsuAbNJJTAB';
    const publicKey = 'oeZed3s_E_7bxbYwi';
    const privateKey = 'IeA0Et1BmdXsuAbNJJTAB'; // Suspiciously same as templateId

    try {
        await emailjs.send(
            serviceId,
            templateId,
            {
                to_email: 'test@example.com',
                to_name: 'Test',
                message: "Test message",
            },
            {
                publicKey: publicKey,
                privateKey: privateKey,
            }
        );
        console.log('✅ Email sent successfully (Unexpected given keys)');
    } catch (error) {
        console.log('✅ Caught expected error:', error.message || error);
    }
}

test().catch(err => {
    console.error('❌ CRITICAL: Uncaught error in test script:', err);
    process.exit(1);
});
