import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "../../../lib/db";
import User from "../../../models/User";
import { sendWelcomeEmail } from "../../../lib/email";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                try {
                    await dbConnect();

                    const existingUser = await User.findOne({ email: user.email });

                    if (!existingUser) {
                        // New User: Create and Send Email
                        await User.create({
                            name: user.name,
                            email: user.email,
                            image: user.image,
                            provider: 'google',
                        });

                        console.log(`🆕 New User Created: ${user.email}`);

                        // Send Welcome Email
                        if (user.email && user.name) {
                            await sendWelcomeEmail(user.email, user.name);
                        }
                    } else {
                        console.log(`👋 Existing User Logged In: ${user.email}`);
                    }
                    return true;
                } catch (error) {
                    console.error("Error saving user to DB:", error);
                    return false;
                }
            }
            return true;
        },
        async session({ session, token }) {
            return session;
        }
    },
    pages: {
        signIn: '/', // Custom sign-in page (the modal on index)
        error: '/',
    },
    debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);
