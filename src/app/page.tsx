'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [dump, setDump] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div className="relative min-h-screen bg-background overflow-hidden font-sans">
      {/* Background Dot Pattern */}
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.4] pointer-events-none" />

      {/* Abstract Background Waves (SVG-like curves) */}
      <motion.div
        animate={{
          y: [0, -15, 0],
          rotate: [0, 1.5, 0, -1.5, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0"
      >
        <svg
          viewBox="0 0 1000 1000"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute -left-[20%] -top-[10%] w-[140%] h-[140%] opacity-20 text-primary"
        >
          <path
            d="M 124 812 C 342 662 254 286 512 344 C 768 402 856 746 952 516"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M 0 500 C 200 600 300 100 600 300 C 900 500 800 800 1000 700"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>

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
            {/* Logo placeholder */}
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
      <main className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 pt-32 pb-24 text-center">
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
          Avec Taskie, planifiez votre <br className="hidden lg:block" />{' '}
          quotidien sans complexité
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

        {/* Input area replacing the big button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-12 max-w-2xl"
        >
          <form onSubmit={handleSubmit} className="relative">
            <div className="glass-pane overflow-hidden rounded-3xl transition-shadow duration-300 focus-within:ring-4 focus-within:ring-primary/20 shadow-xl bg-white/60">
              <textarea
                value={dump}
                onChange={(e) => setDump(e.target.value)}
                placeholder="Ex: 10h cours, 14h rdv médecin, appeler agence, réviser 2h ce soir..."
                className="min-h-[160px] w-full resize-none border-none bg-transparent p-6 text-lg text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-0"
              />
              <div className="flex items-center justify-between border-t border-slate-100 bg-white/40 p-3 px-4 backdrop-blur-sm">
                <span className="text-xs font-medium text-slate-400">
                  {dump.length} caractères
                </span>
                <button
                  type="submit"
                  disabled={!dump.trim() || isSubmitting}
                  className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors disabled:opacity-50"
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
                      Analyse...
                    </span>
                  ) : (
                    'Essayer Taskie'
                  )}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
            <span>🚀 100% gratuit, intelligent & privé !</span>
          </div>
        </motion.div>
      </main>

      {/* Floating Elements (similar to the screenshot) */}
      <div className="absolute inset-0 max-w-7xl mx-auto pointer-events-none z-10 hidden lg:block">
        {/* Floating card 1 - Top Left */}
        <motion.div
          initial={{ opacity: 0, x: -20, rotate: -5 }}
          animate={{ opacity: 1, x: 0, rotate: -5, y: [0, -10, 0] }}
          transition={{
            duration: 0.8,
            delay: 0.6,
            y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="absolute top-40 left-12 glass-pane rounded-2xl p-4 shadow-lg flex items-center gap-4 bg-white/80"
        >
          <div className="rounded-xl bg-purple-100 p-2 text-primary">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path>
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800">Tâche identifiée</p>
            <p className="text-xs text-slate-500">RDV Médecin à 14h</p>
          </div>
          <span className="ml-4 text-[10px] text-slate-400 uppercase">
            À l&apos;instant
          </span>
        </motion.div>

        {/* Floating card 2 - Bottom Left */}
        <motion.div
          initial={{ opacity: 0, x: -20, rotate: 3 }}
          animate={{ opacity: 1, x: 0, rotate: 3, y: [0, 8, 0] }}
          transition={{
            duration: 0.8,
            delay: 0.8,
            y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
          }}
          className="absolute bottom-40 left-20 glass-pane rounded-2xl p-4 shadow-lg flex items-center gap-4 bg-white/80"
        >
          <div className="rounded-xl bg-amber-100 p-2 text-amber-600">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              ></path>
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800">Temps estimé</p>
            <p className="text-xs text-slate-500">
              2h pour &quot;Révisions&quot;
            </p>
          </div>
        </motion.div>

        {/* Floating card 3 - Top Right */}
        <motion.div
          initial={{ opacity: 0, x: 20, rotate: 4 }}
          animate={{ opacity: 1, x: 0, rotate: 4, y: [0, -12, 0] }}
          transition={{
            duration: 0.8,
            delay: 0.7,
            y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 },
          }}
          className="absolute top-52 right-12 glass-pane rounded-2xl p-4 shadow-lg flex items-center gap-4 bg-white/80"
        >
          <div className="rounded-xl bg-green-100 p-2 text-green-600">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              ></path>
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800">Objectif du jour</p>
            <p className="text-xs text-slate-500">Terminé à 100%</p>
          </div>
        </motion.div>

        {/* Floating card 4 - Bottom Right */}
        <motion.div
          initial={{ opacity: 0, x: 20, rotate: -3 }}
          animate={{ opacity: 1, x: 0, rotate: -3, y: [0, 10, 0] }}
          transition={{
            duration: 0.8,
            delay: 0.9,
            y: {
              duration: 5.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1.5,
            },
          }}
          className="absolute bottom-32 right-32 glass-pane rounded-2xl p-4 shadow-lg flex items-center gap-4 bg-white/80"
        >
          <div className="rounded-xl bg-blue-100 p-2 text-blue-600">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800">
              +2h de temps libre
            </p>
            <p className="text-xs text-slate-500">Gagnées ce soir</p>
          </div>
        </motion.div>
      </div>

      {/* Trusted By Section (Optional) */}
      <div className="relative z-10 mx-auto max-w-5xl mt-8 mb-24 px-6 opacity-60 grayscale">
        <p className="text-center text-sm font-medium text-slate-400 mb-8">
          Pensé, conçu et supporté par
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          <span className="text-xl font-bold font-serif">Next.js</span>
          <span className="text-xl font-bold">TAILWIND</span>
          <span className="text-xl font-bold tracking-widest text-[#DB4437]">
            GEMINI
          </span>
          <span className="text-xl font-bold italic">Framer</span>
          <span className="text-xl font-bold">Firebase</span>
        </div>
      </div>

      {/* Floating Footer */}
      <div className="relative z-20 pb-8 px-4 sm:px-6 lg:px-8">
        <footer className="mx-auto max-w-5xl glass-pane rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500 shadow-sm bg-white/70">
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
