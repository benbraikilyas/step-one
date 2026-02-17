import { motion } from 'framer-motion';
import { Award, CheckCircle2, Star } from 'lucide-react';

interface GraduationViewProps {
    onRestart?: () => void;
}

export default function GraduationView({ onRestart }: GraduationViewProps) {
    return (
        <div className="w-full max-w-2xl mx-auto py-12 px-4 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="space-y-12"
            >
                {/* Icon Header */}
                <div className="relative inline-block">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 15 }}
                        className="relative z-10"
                    >
                        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl shadow-white/5">
                            <Award className="w-12 h-12 text-white" strokeWidth={1} />
                        </div>
                    </motion.div>

                    {/* Decorative Elements */}
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.8 + i * 0.1 }}
                            className="absolute"
                            style={{
                                top: '50%',
                                left: '50%',
                                transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-60px)`
                            }}
                        >
                            <Star className="w-3 h-3 text-zinc-500 fill-zinc-500" />
                        </motion.div>
                    ))}
                </div>

                {/* Content */}
                <div className="space-y-6">
                    <motion.h1
                        initial={{ opacity: 0, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        transition={{ delay: 1, duration: 1.5 }}
                        className="text-4xl md:text-5xl font-light tracking-tight text-white"
                    >
                        Clarity Achieved.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5, duration: 1 }}
                        className="text-zinc-500 text-lg max-w-md mx-auto leading-relaxed"
                    >
                        You have completed the 7-day Program.
                        Your journey towards mindful decision-making has only just begun.
                    </motion.p>
                </div>

                {/* Certificate-like Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2, duration: 1 }}
                    className="relative p-10 mt-12 border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm rounded-sm overflow-hidden group"
                >
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                    <div className="relative z-10 space-y-6">
                        <CheckCircle2 className="w-8 h-8 text-zinc-600 mx-auto mb-4" strokeWidth={1} />
                        <h2 className="text-xs uppercase tracking-[0.4em] text-zinc-500">Certificate of Completion</h2>
                        <div className="w-12 h-[1px] bg-zinc-800 mx-auto"></div>
                        <p className="text-sm font-mono text-zinc-400">
                            STEP ONE PROGRAM: PHASE 1
                        </p>
                    </div>

                    {/* Animated Ray */}
                    <div className="absolute -inset-x-full top-0 h-full w-[200%] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[3000ms] ease-in-out"></div>
                </motion.div>

                {/* Footer Action */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3, duration: 1 }}
                    className="pt-8"
                >
                    <button
                        onClick={() => window.location.reload()}
                        className="text-xs uppercase tracking-widest text-zinc-600 hover:text-white transition-colors flex items-center gap-2 mx-auto"
                    >
                        Return to awareness
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
}
