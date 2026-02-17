import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "../../../lib/db";
import User from "../../../models/User";
import { sendWelcomeEmail } from "../../../lib/email";

import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                await dbConnect();
                const user = await User.findOne({ email: credentials.email }).select('+password');

                if (!user || !user.password) {
                    throw new Error("Invalid credentials");
                }

                const bcrypt = await import('bcryptjs');
                const isValid = await bcrypt.compare(credentials.password, user.password);

                if (!isValid) {
                    throw new Error("Invalid credentials");
                }

                return user;
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            if (account?.provider === "google" && user) {
                // ... logic for google ...
            }
            return token;
        },
        async session({ session, token }) {
            // ensure we pass the user id if needed
            if (session.user && token.sub) {
                // session.user.id = token.sub; // typescript might complain without interface extension
            }
            return session;
        },
        async signIn({ user, account }) {
            const fs = require('fs');
            const path = require('path');
            const logFile = path.join(process.cwd(), 'auth-debug.log');
            const log = (msg: string) => {
                try {
                    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
                } catch (e) { console.error('Logging failed', e); }
            };

            log(`signIn called for ${user?.email}, provider: ${account?.provider}`);

            if (account?.provider === "google") {
                try {
                    log('Connecting to DB...');
                    await dbConnect();
                    log('DB connected.');

                    const existingUser = await User.findOne({ email: user.email });
                    log(`User search complete. Found: ${!!existingUser}`);

                    if (!existingUser) {
                        log('Creating new user...');
                        const newUser = new User({
                            name: user.name,
                            email: user.email,
                            image: user.image,
                            provider: "google",
                        });

                        await newUser.save();
                        log(`User saved: ${user.email}`);

                        console.log(` New User Created: ${user.email}`);

                        if (user.email && user.name) {
                            log('Sending welcome email...');
                            await sendWelcomeEmail(user.email, user.name);
                            log('Email sending attempt finished.');
                        }
                    } else {
                        console.log(`✅ Existing User Logged In: ${user.email}`);
                        log('Existing user logged in.');
                    }

                    log('Returning true from signIn.');
                    return true;
                } catch (error: any) {
                    console.error("❌ Database error:", error);
                    log(`ERROR in signIn: ${error?.message}`);
                    return true;
                }
            }
            log('Provider not google, returning true.');
            return true;
        },
    },
    pages: {
        signIn: '/', // Custom sign-in page (the modal on index)
        error: '/',
    },
    debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);
