'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [dump, setDump] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération. L'API Key est-elle configurée ?");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-8">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 h-full w-full max-w-7xl -translate-x-1/2 overflow-hidden opacity-50 pointer-events-none">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />
      </div>

      <motion.div
        className="z-10 w-full max-w-2xl space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="space-y-3 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mx-auto w-max rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/80 backdrop-blur-md shadow-sm"
          >
            ✨ Taskie V1
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Videz votre{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
              cerveau.
            </span>
          </h1>
          <p className="mx-auto max-w-lg text-lg text-white/60">
            Écrivez tout ce que vous avez à faire aujourd&apos;hui, peu importe
            le format. L&apos;IA s&apos;occupe de créer un plan parfait.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative mt-8 space-y-4">
          <div className="glass-pane overflow-hidden rounded-3xl transition-all duration-300 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/20">
            <textarea
              value={dump}
              onChange={(e) => setDump(e.target.value)}
              placeholder="ex: 10h cours, 14h rdv médecin, appeler maman, réviser 2h, sport ce soir..."
              className="min-h-[200px] w-full resize-none border-none bg-transparent p-6 text-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-0"
            />
            <div className="flex items-center justify-between border-t border-white/10 bg-white/5 p-3 px-4 backdrop-blur-md">
              <span className="text-xs font-medium text-white/40">
                {dump.length} caractères
              </span>
              <button
                type="submit"
                disabled={!dump.trim() || isSubmitting}
                className="group relative flex items-center justify-center overflow-hidden rounded-xl bg-primary px-6 py-2.5 font-medium text-white transition-all hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isSubmitting ? (
                    <>
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
                      Génération...
                    </>
                  ) : (
                    'Organiser ma journée'
                  )}
                </span>
                <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent flex -translate-x-full transition-all duration-500 group-hover:translate-x-full" />
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </main>
  );
}
