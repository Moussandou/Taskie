'use client';

import { useEffect, useState } from 'react';
import { Task } from '@/domain/task.schema';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

export default function DraftPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('18:00');
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('taskie_tasks');
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTasks(JSON.parse(saved));
      } catch {
        console.error('Failed to parse tasks');
      }
    }
  }, []);

  const handleUpdateTask = (
    index: number,
    field: keyof Task,
    value: string | number | null
  ) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setTasks(newTasks);
    localStorage.setItem('taskie_tasks', JSON.stringify(newTasks));
  };

  const handleDeleteTask = (index: number) => {
    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks);
    localStorage.setItem('taskie_tasks', JSON.stringify(newTasks));
  };

  const handleAddTask = () => {
    const newTask: Task = {
      titre: 'Nouvelle tâche',
      duree_estimee: 30,
      contexte: 'any',
      importance: 3,
      energie: 'medium',
      deadline: null,
      date: null,
      flexibilite: 'flexible',
    };
    const newTasks = [...tasks, newTask];
    setTasks(newTasks);
    localStorage.setItem('taskie_tasks', JSON.stringify(newTasks));
  };

  const handleGenerate = () => {
    // Save constraints/settings here if necessary
    // Proceed to schedule
    router.push('/timeline');
  };

  return (
    <div className="relative min-h-screen bg-background font-sans flex flex-col pt-24 pb-32">
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 flex justify-center overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern [mask-image:radial-gradient(ellipse_at_top,white,transparent_80%)] opacity-70" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-6 lg:px-8 flex-grow flex flex-col gap-12">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Vérifiez vos tâches
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              L&apos;IA a découpé votre demande. Ajustez les durées, supprimez
              ou ajoutez des tâches.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Retour
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main List Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">
                Liste ({tasks.length})
              </h2>
              <button
                onClick={handleAddTask}
                className="text-sm font-medium text-primary hover:text-primary-hover flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Ajouter manuellement
              </button>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {tasks.map((task, i) => (
                  <motion.div
                    key={task.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-pane rounded-2xl p-5 border border-white/50 bg-white/60 shadow-sm relative group"
                  >
                    <button
                      onClick={() => handleDeleteTask(i)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Titre de la tâche
                        </label>
                        <input
                          type="text"
                          value={task.titre}
                          onChange={(e) =>
                            handleUpdateTask(i, 'titre', e.target.value)
                          }
                          className="w-full bg-transparent font-medium text-slate-800 border-b border-transparent hover:border-slate-200 focus:border-primary focus:outline-none transition-colors"
                        />
                      </div>

                      <div className="md:col-span-2 relative group flex flex-col justify-end">
                        <label className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center justify-between mb-1">
                          <span className="uppercase">Durée (min)</span>
                          <span className="text-primary text-[14px] font-extrabold bg-primary/10 px-2.5 py-1 rounded-md">
                            {formatDuration(task.duree_estimee)}
                          </span>
                        </label>
                        <input
                          type="number"
                          value={task.duree_estimee}
                          onChange={(e) =>
                            handleUpdateTask(
                              i,
                              'duree_estimee',
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full bg-transparent font-medium text-slate-800 border-b border-transparent hover:border-slate-200 focus:border-primary focus:outline-none transition-colors"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Date (Option)
                        </label>
                        <input
                          type="date"
                          value={task.date || ''}
                          onChange={(e) =>
                            handleUpdateTask(i, 'date', e.target.value || null)
                          }
                          className="w-full bg-transparent font-medium text-slate-800 border-b border-transparent hover:border-slate-200 focus:border-primary focus:outline-none transition-colors"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Énergie
                        </label>
                        <select
                          value={task.energie}
                          onChange={(e) =>
                            handleUpdateTask(i, 'energie', e.target.value)
                          }
                          className="w-full bg-transparent font-medium text-slate-800 border-b border-transparent hover:border-slate-200 focus:border-primary focus:outline-none transition-colors"
                        >
                          <option value="low">Basse</option>
                          <option value="medium">Moyenne</option>
                          <option value="high">Haute</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Settings Column */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">Paramètres</h2>

            <div className="glass-pane rounded-2xl p-6 border border-white/50 bg-white/60 shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Début de journée
                </label>
                <input
                  type="time"
                  value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Fin de journée
                </label>
                <input
                  type="time"
                  value={workEnd}
                  onChange={(e) => setWorkEnd(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleGenerate}
                  className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover hover:-translate-y-0.5 transition-all"
                >
                  Générer mon planning
                </button>
                <p className="mt-3 text-center text-xs text-slate-400">
                  L&apos;IA placera intelligemment les {tasks.length} tâches
                  dans cet intervalle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
