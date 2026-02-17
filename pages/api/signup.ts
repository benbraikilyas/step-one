import type { NextApiRequest, NextApiResponse } from 'next';
import { sendWelcomeEmail } from '../../lib/email';
import dbConnect from '../../lib/db';
import User from '../../models/User';

type Data = {
    message?: string;
    error?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, firstName, middleName, lastName } = req.body;

    if (!email || !firstName || !lastName) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await dbConnect();

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists. Please sign in.' });
        } else {
            // Normally we'd create the user here if not using NextAuth Google
            // But if the user is using the custom signup form, we create them
            const bcrypt = await import('bcryptjs');
            const hashedPassword = await bcrypt.hash(req.body.password, 10);

            await User.create({
                email,
                password: hashedPassword,
                name: `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim(),
                hasCompletedProgram: false
            });
        }

        // Send Welcome Email
        const displayName = firstName;
        await sendWelcomeEmail(email, displayName);

        return res.status(200).json({ message: 'Welcome email triggered successfully' });
    } catch (error) {
        console.error("❌ Signup API Error:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
