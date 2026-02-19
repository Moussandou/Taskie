'use client';

import { useEffect, useState } from 'react';
import { Task } from '@/domain/task.schema';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function TimelinePage() {
  const [tasks, setTasks] = useState<Task[]>([]);

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

  return (
    <main className="min-h-screen bg-background p-8 font-sans">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Mon Planning
          </h1>
          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-white/5 py-2 px-4 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            Nouveau Dump
          </Link>
        </header>

        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/50">
              Aucune tâche trouvée.
            </div>
          ) : (
            tasks.map((task, i) => (
              <motion.div
                key={task.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-pane rounded-2xl p-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">{task.titre}</h3>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
                    {task.duree_estimee} min
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <span className="rounded-md bg-primary/20 px-2 py-1 text-xs text-primary-hover">
                    {task.contexte}
                  </span>
                  <span className="rounded-md bg-amber-500/20 px-2 py-1 text-xs text-amber-500">
                    Énergie: {task.energie}
                  </span>
                  {task.importance && (
                    <span className="rounded-md bg-rose-500/20 px-2 py-1 text-xs text-rose-500">
                      Importance: {task.importance}/5
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
