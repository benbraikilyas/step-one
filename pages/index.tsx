import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useDecision } from '@/hooks/useDecision';
import Head from 'next/head';
import LightRays from '@/components/LightRays';
import IntroAnimation from '@/components/IntroAnimation';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import LoginInterface from '@/components/LoginInterface';

const BackgroundAudio = dynamic(() => import('@/components/BackgroundAudio'), { ssr: false });

const QUESTIONS = [
  "What is the single biggest thing weighing on your mind right now?",
  "If you could only do one thing in today to make tomorrow better, what would it be?",
  "What is the worst-case scenario if you do nothing?",
  "How much energy do you realistically have (1-10)?",
  "Is there a deadline involved? If so, when?"
];

export default function Home() {
  const { data: session, status } = useSession();
  const { decision, loading, error, submitAnswers } = useDecision();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(QUESTIONS.length).fill(""));
  const [showIntro, setShowIntro] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  // Skip intro if decision already exists or user is logged in
  useEffect(() => {
    if (decision || status === 'authenticated') {
      setShowIntro(false);
      setShowLogin(false);
    }
  }, [decision, status]);

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = e.target.value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      submitAnswers(answers);
    }
  };

  const isLastQuestion = currentStep === QUESTIONS.length - 1;
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center p-6 bg-radial-gradient relative overflow-hidden">
      <BackgroundAudio url="https://www.youtube.com/live/33oamxiVGZ4?si=RVRtjj8347mPy4Ui" />
      <div className="fixed inset-0 z-0">
        <LightRays
          raysOrigin="top-center"
          raysColor="#faf9f6"
          raysSpeed={1.6}
          lightSpread={0.5}
          rayLength={2.1}
          pulsating={false}
          fadeDistance={1.4}
          saturation={1}
          followMouse
          mouseInfluence={0.1}
          noiseAmount={0.25}
          distortion={0}
        />
      </div>
      <Head>
        <title>one step </title>

        <meta name="description" content="One decision per day." />
      </Head>



      <AnimatePresence mode="wait">
        {showIntro ? (
          <motion.div
            key="intro"
            exit={{ opacity: 0, transition: { duration: 1 } }}
            className="relative z-50"
          >
            <IntroAnimation onComplete={() => {
              setShowIntro(false);
              setShowLogin(true);
            }} />
          </motion.div>
        ) : showLogin ? (

          <motion.div
            key="login"
            initial={{ opacity: 0, filter: 'blur(20px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(10px)', transition: { duration: 0.8 } }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="w-full h-full flex items-center justify-center relative z-50"
          >
            <LoginInterface onLoginComplete={() => setShowLogin(false)} />
          </motion.div>
        ) : (
          <motion.main
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="w-full max-w-md mx-auto space-y-8 relative z-10"
          >

            {/* Header (Hidden when decision is shown) */}
            {!decision && (
              <header className="text-center opacity-50 mb-12">
                <h1 className="text-xs uppercase tracking-[0.3em] text-zinc-400">Decision Recovery</h1>
              </header>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center space-y-4 py-20">
                <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin"></div>
                <p className="text-zinc-500 text-sm tracking-widest animate-pulse">COMPRESSING...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-red-400 text-center border border-red-900/50 p-4 rounded bg-red-950/20">
                <p className="text-sm">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 text-xs underline">Try Again</button>
              </div>
            )}

            {/* Question Flow */}
            {!decision && !loading && !error && (
              <div className="space-y-6">
                <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="min-h-[200px] flex flex-col justify-center">
                  <h2 className="text-2xl font-light leading-relaxed mb-6 text-zinc-200">
                    {QUESTIONS[currentStep]}
                  </h2>
                  <textarea
                    autoFocus
                    className="w-full bg-transparent border-b border-zinc-800 focus:border-white outline-none py-2 text-xl placeholder-zinc-800 transition-colors resize-none mb-4"
                    placeholder="Type here..."
                    value={answers[currentStep]}
                    onChange={handleAnswerChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (answers[currentStep].trim()) handleNext();
                      }
                    }}
                  />
                </div>

                <div className="flex justify-between items-center pt-4">
                  <span className="text-zinc-600 text-xs">
                    {currentStep + 1} / {QUESTIONS.length}
                  </span>
                  <button
                    onClick={handleNext}
                    disabled={!answers[currentStep].trim()}
                    className="px-8 py-3 bg-white text-black text-sm font-medium hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    {isLastQuestion ? "COMPLETE" : "NEXT"}
                  </button>
                </div>
              </div>
            )}

            {/* Result View */}
            {decision && (
              <div className="text-center space-y-8 animate-in slide-in-from-bottom duration-700">
                <div className="border border-zinc-800 p-10 bg-zinc-900/30 backdrop-blur-sm rounded-sm">
                  <p className="text-xs uppercase tracking-widest text-zinc-500 mb-6">Your Single Action</p>
                  <h2 className="text-3xl md:text-4xl font-light leading-tight text-white mb-8">
                    {decision}
                  </h2>
                  <div className="w-12 h-[1px] bg-zinc-700 mx-auto my-8"></div>
                  <p className="text-zinc-500 text-sm">Session Locked.</p>
                </div>
                <p className="text-zinc-700 text-xs">Come back tomorrow.</p>
              </div>
            )}

          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
