import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Brain, Lock, Mail, Key } from 'lucide-react';
import { FcGoogle } from "react-icons/fc";
import { signIn } from "next-auth/react";

interface LoginInterfaceProps {
    onLoginComplete: () => void;
}

export default function LoginInterface({ onLoginComplete }: LoginInterfaceProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isSignUp) {
                const res = await fetch('/api/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, firstName, middleName, lastName, password }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    alert(data.error || 'Signup failed');
                    setIsLoading(false);
                    return;
                }
            }

            // For both signup (after creation) and login, we authenticate
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                alert(result.error);
                setIsLoading(false);
                return;
            }

            // Success
            setTimeout(() => {
                setIsLoading(false);
                onLoginComplete();
            }, 500);
        } catch (error: any) {
            setIsLoading(false);
            console.error("Action error:", error);
            alert(error.message || "An error occurred");
        }
    };

    const handleGoogleSignIn = async () => {
        await signIn('google');
    };

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-center justify-center p-6 relative z-10">
            {/* Left Side: Value Propositions */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex-1 space-y-8 text-zinc-300 md:pr-12"
            >
                <div className="flex items-center gap-4 group">
                    <div className="p-3 bg-zinc-800/50 rounded-2xl group-hover:bg-zinc-800/80 transition-colors">
                        <Brain className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-medium mb-1">Clear Your Mind</h3>
                        <p className="text-sm text-zinc-500">Reduce cognitive load with single-task focus.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 group">
                    <div className="p-3 bg-zinc-800/50 rounded-2xl group-hover:bg-zinc-800/80 transition-colors">
                        <Lock className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-medium mb-1">Private by Default</h3>
                        <p className="text-sm text-zinc-500">Your decisions vanish after 24 hours.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 group">
                    <div className="p-3 bg-zinc-800/50 rounded-2xl group-hover:bg-zinc-800/80 transition-colors">
                        <Shield className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-medium mb-1">Unbiased Safety</h3>
                        <p className="text-sm text-zinc-500">No algorithm. No feed. Just you.</p>
                    </div>
                </div>
            </motion.div>

            {/* Right Side: Login/Sign-up Card with 3D Rotation */}
            <div className="flex-1 w-full max-w-md" style={{ perspective: "1200px" }}>
                <motion.div
                    initial={false}
                    animate={{ rotateY: isSignUp ? 180 : 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    style={{ transformStyle: "preserve-3d" }}
                    className="relative"
                >
                    {/* Front: Login Form */}
                    <div
                        className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl shadow-black/50"
                        style={{ backfaceVisibility: "hidden" }}
                    >
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-light text-white mb-2">Welcome Back</h2>
                            <p className="text-zinc-500 text-sm">Resuming your session where you left off.</p>
                        </div>

                        <form onSubmit={handleAction} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-zinc-500 ml-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-white/20 focus:bg-black/30 transition-all placeholder:text-zinc-700"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-zinc-500 ml-1">Password</label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-white/20 focus:bg-black/30 transition-all placeholder:text-zinc-700"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-zinc-500 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-400 transition-colors">
                                    <input type="checkbox" className="rounded border-zinc-700 bg-black/20" />
                                    <span>Remember me</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsSignUp(true)}
                                    className="text-white hover:underline transition-all"
                                >
                                    Create new account
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-white text-black font-medium py-3 rounded-xl mt-6 hover:bg-zinc-200 focus:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Signing in..." : "Sign In"}
                            </button>
                        </form>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#09090b] px-2 text-zinc-600">Or continue with</span>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={handleGoogleSignIn}
                                className="flex items-center justify-center gap-2 bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/10 py-2.5 rounded-xl transition-all group w-full"
                            >
                                <FcGoogle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="text-sm text-zinc-400 group-hover:text-zinc-200">Google</span>
                            </button>
                        </div>
                    </div>

                    {/* Back: Sign-up Form */}
                    <div
                        className="absolute top-0 left-0 w-full bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl shadow-black/50"
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-light text-white mb-2">Join Step One</h2>
                            <p className="text-zinc-500 text-sm">Start your 7-day journey to clarity.</p>
                        </div>

                        <form onSubmit={handleAction} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider text-zinc-500 ml-1">First Name</label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-white/20 transition-all text-sm"
                                        placeholder="John"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider text-zinc-500 ml-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-white/20 transition-all text-sm"
                                        placeholder="Doe"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-wider text-zinc-500 ml-1">Middle Name (Optional)</label>
                                <input
                                    type="text"
                                    value={middleName}
                                    onChange={(e) => setMiddleName(e.target.value)}
                                    className="w-full bg-black/20 border border-white/5 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-white/20 transition-all text-sm"
                                    placeholder="Quincy"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-wider text-zinc-500 ml-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/20 border border-white/5 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-white/20 transition-all text-sm"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-wider text-zinc-500 ml-1">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/20 border border-white/5 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-white/20 transition-all text-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-white text-black font-medium py-3 rounded-xl mt-4 hover:bg-zinc-200 focus:scale-[0.98] transition-all disabled:opacity-50 text-sm"
                            >
                                {isLoading ? "Creating account..." : "Create Account"}
                            </button>
                        </form>

                        <div className="text-center mt-6">
                            <button
                                type="button"
                                onClick={() => setIsSignUp(false)}
                                className="text-xs text-zinc-500 hover:text-white transition-colors"
                            >
                                Already have an account? <span className="underline">Sign In</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
