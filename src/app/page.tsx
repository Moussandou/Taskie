'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const PLACEHOLDERS = [
  '10h cours, 14h rdv médecin, appeler agence, réviser 2h ce soir...',
  'Sortir le chien, acheter du pain, avancer sur le projet React...',
  'Réunion à 9h, déjeuner avec Paul, séance de sport à 18h...',
];

export default function Home() {
  const [dump, setDump] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Rotation du placeholder
    const interval = setInterval(() => {
      if (!isFocused && !dump) {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isFocused, dump]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dump.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dump }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      localStorage.setItem('taskie_tasks', JSON.stringify(data.tasks));
      router.push('/timeline');
    } catch (error: unknown) {
      console.error(error);
      const msg = error instanceof Error ? error.message : 'Erreur';
      alert('Erreur lors de la génération: ' + msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden font-sans flex flex-col">
      {/* Soft Animated Mesh Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-primary/10 blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], x: [0, -40, 0], y: [0, 50, 0] }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
          className="absolute top-[20%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-purple-300/20 blur-[120px]"
        />
      </div>

      {/* Navigation */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'p-4' : 'p-0'
        }`}
      >
        <header
          className={`mx-auto flex max-w-7xl items-center justify-between transition-all duration-300 ${
            isScrolled
              ? 'glass-pane rounded-full px-6 py-3 shadow-lg bg-white/70'
              : 'px-6 py-6 lg:px-8'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white font-bold text-lg">
              T
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Taskie
            </span>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <button className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors">
              Mon Espace
            </button>
          </div>
        </header>
      </div>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 pt-32 pb-24 text-center flex-grow flex flex-col justify-center items-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-sm font-medium text-slate-500 mb-4"
        >
          Votre cerveau mérite mieux qu&apos;une gestion manuelle
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl lg:leading-tight"
        >
          Libérez votre esprit, <br className="hidden lg:block" /> l&apos;IA
          organise votre journée.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-slate-600"
        >
          Gérez vos tâches, vos impératifs horaires et votre niveau
          d&apos;énergie depuis une seule plateforme intelligente.
        </motion.p>

        {/* Input area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-12 w-full max-w-3xl"
        >
          <form onSubmit={handleSubmit} className="relative z-20">
            <motion.div
              animate={{
                height: isFocused || dump.length > 50 ? 'auto' : '180px',
                boxShadow: isFocused
                  ? '0 20px 40px -15px rgba(90, 79, 207, 0.2)'
                  : '0 10px 30px -15px rgba(0, 0, 0, 0.1)',
              }}
              className="glass-pane overflow-hidden rounded-[2rem] transition-all duration-300 border-2 border-transparent focus-within:border-primary/30 bg-white/70 flex flex-col"
            >
              <div className="relative flex-grow">
                <textarea
                  ref={textareaRef}
                  value={dump}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onChange={(e) => setDump(e.target.value)}
                  className="absolute inset-0 h-full w-full resize-none border-none bg-transparent p-6 pb-2 text-xl text-foreground focus:outline-none focus:ring-0 leading-relaxed z-10"
                />
                {!dump && (
                  <div className="absolute inset-0 p-6 text-xl text-slate-400 pointer-events-none overflow-hidden flex items-start">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={placeholderIndex}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.4 }}
                        className="inline-block"
                      >
                        Ex: {PLACEHOLDERS[placeholderIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100/50 bg-white/30 p-3 px-5 backdrop-blur-sm mt-auto">
                <span className="text-xs font-medium text-slate-500 flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${dump.length > 10 ? 'bg-green-400' : 'bg-slate-300'} transition-colors duration-300`}
                  ></span>
                  {dump.length} caractères
                </span>
                <button
                  type="submit"
                  disabled={!dump.trim() || isSubmitting}
                  className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-primary-hover hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Génération en cours...
                    </span>
                  ) : (
                    'Essayer Taskie'
                  )}
                </button>
              </div>
            </motion.div>
          </form>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 backdrop-blur-sm px-5 py-2 text-xs font-semibold tracking-wide text-slate-600 shadow-sm">
            <span>100% gratuit, intelligent & privé !</span>
          </div>
        </motion.div>
      </main>

      {/* Floating Footer in its own section */}
      <div className="relative z-20 w-full pb-8 px-4 sm:px-6 lg:px-8 mt-auto">
        <footer className="mx-auto max-w-5xl glass-pane rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500 shadow-sm bg-white/70">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
              T
            </div>
            <span className="font-semibold text-slate-700">Taskie AI</span>
          </div>

          <p className="text-center md:text-left">
            © {new Date().getFullYear()} Taskie AI. Tous droits réservés.
          </p>

          <div className="flex gap-6 font-medium">
            <a href="#" className="hover:text-primary transition-colors">
              Général
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Confidentialité
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Mentions Légales
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
