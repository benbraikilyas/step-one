import { useSession, signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDecision } from '@/hooks/useDecision';
import Head from 'next/head';
import LightRays from '@/components/LightRays';
import IntroAnimation from '@/components/IntroAnimation';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import LoginInterface from '@/components/LoginInterface';
import GraduationView from '@/components/GraduationView';
import Image from 'next/image';

const BackgroundAudio = dynamic(() => import('@/components/BackgroundAudio'), { ssr: false });

export default function Home() {
  const { data: session, status } = useSession();
  const { decision, loading, error, alreadyCompletedToday, isGraduating, submitAnswers } = useDecision();
  const [currentStep, setCurrentStep] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showIntro, setShowIntro] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [hasCompletedProgram, setHasCompletedProgram] = useState(false);
  const [showGraduation, setShowGraduation] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Fetch AI-generated questions when user is authenticated
  useEffect(() => {
    // Check if we are forcing a day debug mode
    const urlParams = new URLSearchParams(window.location.search);
    const hasForceDay = urlParams.has('day');

    // If forcing day, ignore decision check. Otherwise, respect it.
    const shouldFetch = session && !showIntro && (hasForceDay || (!decision && questions.length === 0));

    if (shouldFetch) {
      fetchQuestions();
    }
  }, [session, showIntro, decision, questions.length]);

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      // Get forced day from URL for testing if present
      const urlParams = new URLSearchParams(window.location.search);
      const forcedDay = urlParams.get('day');
      const endpoint = forcedDay ? `/api/questions?forceToDay=${forcedDay}` : '/api/questions';

      const res = await fetch(endpoint);
      const data = await res.json();

      if (res.ok && data.questions) {
        setQuestions(data.questions);
        setDayNumber(data.dayNumber || 1);
        setAnswers(Array(data.questions.length).fill(""));
        setHasCompletedProgram(data.hasCompletedProgram || false);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      // Set fallback questions so the UI is never empty
      const fallback = [
        "What's on your mind today?",
        "What would make today feel successful?",
        "What's one small step you could take right now?"
      ];
      setQuestions(fallback);
      setDayNumber(1);
      setAnswers(Array(fallback.length).fill(""));
    } finally {
      setLoadingQuestions(false);
    }
  };

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
    if (currentStep < questions.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      submitAnswers(answers, questions, dayNumber);
    }
  };

  const isLastQuestion = currentStep === questions.length - 1;
  const progress = ((currentStep + 1) / questions.length) * 100;

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
        <title>STEP ONE </title>
        <meta name="depression" content="step one per day." />
        <meta name="description" content="One decision per day." />
        <meta name="step one" content="step one per day." />
        <meta name="gemini" content="friend in your path." />
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
            className={`w-full ${showGraduation || hasCompletedProgram ? 'max-w-2xl' : 'max-w-md'} mx-auto space-y-8 relative z-10`}
          >


            {/* User Profile & Logout */}
            {session?.user && (
              <div className="fixed top-8 right-8 flex items-center z-50 user-header-animate">
                <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-zinc-900/40 border border-zinc-800/40 backdrop-blur-xl hover:bg-zinc-900/60 transition-all shadow-lg shadow-black/20">
                  {session.user.image && (
                    <Image src={session.user.image} alt="Profile" width={32} height={32} className="w-8 h-8 rounded-full opacity-80 grayscale hover:grayscale-0 transition-all" />
                  )}
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest leading-none">
                      {session.user.name || "User"}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-zinc-700 mx-1"></div>
                  <button
                    onClick={() => signOut()}
                    className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                    title="Log Out"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            )}

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
            {(!decision || new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').has('day')) && !loading && !error && !hasCompletedProgram && !showGraduation && (
              <div className="space-y-6">
                <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="min-h-[200px] flex flex-col justify-center">
                  <h2 className="text-2xl font-light leading-relaxed mb-6 text-zinc-200">
                    {questions[currentStep]}
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
                    {currentStep + 1} / {questions.length}
                  </span>
                  <button
                    onClick={handleNext}
                    disabled={!answers[currentStep]?.trim()?.length}
                    className="px-8 py-3 bg-white text-black text-sm font-medium hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    {isLastQuestion ? "COMPLETE" : "NEXT"}
                  </button>
                </div>
              </div>
            )}

            {/* Graduation State */}
            {(hasCompletedProgram || (showGraduation && decision)) && (
              <div className="animate-in fade-in zoom-in duration-1000">
                <GraduationView />
              </div>
            )}

            {/* Result View */}
            {decision && !showGraduation && !hasCompletedProgram && !new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').has('day') && (
              <div className="text-center space-y-8 animate-in slide-in-from-bottom duration-700">
                <div className="border border-zinc-800 p-10 bg-zinc-900/30 backdrop-blur-sm rounded-sm">
                  <p className="text-xs uppercase tracking-widest text-zinc-500 mb-6">
                    {alreadyCompletedToday ? "Your Focus for Today" : "Your Single Action"}
                  </p>
                  <h2 className="text-3xl md:text-4xl font-light leading-tight text-white mb-8">
                    {decision}
                  </h2>
                  <div className="w-12 h-[1px] bg-zinc-700 mx-auto my-8"></div>
                  <p className="text-zinc-500 text-sm">
                    {alreadyCompletedToday ? "You've already received your step for today." : "Session Locked."}
                  </p>
                </div>
                {isGraduating ? (
                  <button
                    onClick={() => setShowGraduation(true)}
                    className="px-8 py-3 border border-white/20 text-white text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                  >
                    Collect Certificate
                  </button>
                ) : (
                  <p className="text-zinc-700 text-xs text-center">Come back tomorrow.</p>
                )}
              </div>
            )}

          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
