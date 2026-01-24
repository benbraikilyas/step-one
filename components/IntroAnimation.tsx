import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const sentences = [
    "You're not broken",
    "You're overloaded",
    "Let's reduce the noise"
];

interface IntroAnimationProps {
    onComplete: () => void;
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        // Total duration per sentence: enter (2.5s) + pause (1.5s)
        const interval = setTimeout(() => {
            if (index < sentences.length - 1) {
                setIndex(prev => prev + 1);
            } else {
                // Wait a bit after the last sentence before completing
                setTimeout(onComplete, 2000);
            }
        }, 4000);

        return () => clearTimeout(interval);
    }, [index, onComplete]);

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <AnimatePresence mode="wait">
                <motion.p
                    key={index}
                    initial={{ opacity: 0, filter: 'blur(10px)', scale: 0.95 }}
                    animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                    exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.05, transition: { duration: 1.5, ease: "easeIn" } }}
                    transition={{ duration: 2.5, ease: "easeOut" }}
                    className="text-2xl md:text-3xl font-light text-white tracking-wide text-center"
                >
                    {sentences[index]}
                </motion.p>
            </AnimatePresence>
        </div>
    );
}
