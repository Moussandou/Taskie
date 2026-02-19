'use client';

import { useEffect, useState } from 'react';
import { Task } from '@/domain/task.schema';
import Link from 'next/link';
import {
  format,
  parseISO,
  addDays,
  isSameDay,
  addMinutes,
  startOfWeek,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

interface ScheduledTask extends Task {
  scheduledStart: string;
  scheduledEnd: string;
  status?: string;
  autoScheduled?: boolean;
}

const MIN_HOUR = 8; // 08:00
const MAX_HOUR = 20; // 20:00
const HOUR_HEIGHT = 80; // pixels per hour

// --- DND Components ---

function DroppableDayColumn({
  day,
  children,
}: {
  day: Date;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id: day.toISOString(),
  });

  return (
    <div
      ref={setNodeRef}
      className="flex-1 relative border-r border-slate-100 last:border-r-0 min-w-[200px] z-10"
    >
      {children}
    </div>
  );
}

function DraggableTaskCard({
  task,
  style,
  isDone,
  onSnooze,
  onDone,
  onAcceptAuto,
}: {
  task: ScheduledTask;
  style: { top: number; height: number; className: string };
  isDone: boolean;
  onSnooze: (id: string) => void;
  onDone: (id: string) => void;
  onAcceptAuto: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id || `task-${task.titre}`,
    data: { task },
    disabled: isDone, // On ne drag pas les tâches terminées
  });

  const transformStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
        opacity: 0.9,
        boxShadow:
          '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      }
    : undefined;

  const isShort = style.height < 45;

  return (
    <div
      ref={setNodeRef}
      className={`absolute left-1.5 right-1.5 rounded-xl cursor-grab active:cursor-grabbing group z-10 hover:z-50 ${transformStyle ? '' : 'transition-all'}`}
      style={{
        top: `${style.top}px`,
        height: `${style.height}px`,
        minHeight: isShort ? '34px' : undefined,
        ...transformStyle,
      }}
      {...listeners}
      {...attributes}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-full border p-2 flex flex-col shadow-sm transition-all rounded-xl overflow-hidden backdrop-blur-sm bg-opacity-95 
        ${task.autoScheduled ? 'ring-2 ring-primary ring-offset-1 ring-offset-white' : ''} 
        ${style.className} 
        ${isDone ? 'opacity-40 grayscale cursor-default' : ''}
        ${isShort ? 'hover:h-auto hover:min-h-fit hover:z-50 hover:shadow-xl' : ''}`}
      >
        <div className="flex justify-between items-start mb-1 pointer-events-none gap-2">
          <div
            className={`text-[10px] whitespace-nowrap font-bold uppercase tracking-widest opacity-60 ${isDone ? 'line-through' : ''}`}
          >
            {format(parseISO(task.scheduledStart), 'HH:mm')} -{' '}
            {format(parseISO(task.scheduledEnd), 'HH:mm')}
          </div>

          {/* Actions (Snooze & Done) */}
          <div
            className={`flex items-center gap-1 opacity-0 ${isShort ? 'group-hover:opacity-100' : 'group-hover:opacity-100'} transition-opacity pointer-events-auto shrink-0 bg-white/50 backdrop-blur-md rounded-md p-0.5`}
          >
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onSnooze(task.id!);
              }}
              className="px-1.5 py-0.5 rounded-md hover:bg-black/10 text-slate-700 text-[10px] font-bold transition-colors"
              title="Snooze à demain"
            >
              Zz
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDone(task.id!);
              }}
              className="px-1.5 py-0.5 rounded-md hover:bg-emerald-500/20 text-emerald-700 font-bold transition-colors"
              title={isDone ? 'Annuler le statut Fait' : 'Marquer comme fait'}
            >
              {isDone ? '↺' : '✓'}
            </button>
          </div>
        </div>

        <h3
          className={`font-bold text-xs sm:text-sm leading-tight mt-0.5 pointer-events-none line-clamp-2 ${isShort ? 'group-hover:line-clamp-none' : ''} ${isDone ? 'line-through opacity-70' : ''}`}
        >
          {task.titre}
        </h3>

        {!isShort && task.duree_estimee >= 30 && (
          <div className="mt-auto flex items-center gap-2 text-[10px] font-semibold opacity-70 truncate pt-2 pointer-events-none group-hover:flex">
            {task.contexte !== 'any' && (
              <span className="px-1.5 py-0.5 bg-black/5 rounded">
                📍 {task.contexte}
              </span>
            )}
            <span className="px-1.5 py-0.5 bg-black/5 rounded">
              ⚡ {task.energie}
            </span>
          </div>
        )}

        {isShort && (
          <div className="hidden group-hover:flex mt-auto items-center gap-2 text-[10px] font-semibold opacity-70 truncate pt-2 pointer-events-none">
            {task.contexte !== 'any' && (
              <span className="px-1.5 py-0.5 bg-black/5 rounded">
                📍 {task.contexte}
              </span>
            )}
            <span className="px-1.5 py-0.5 bg-black/5 rounded">
              ⚡ {task.energie}
            </span>
          </div>
        )}

        {/* HUD pour auto-suggestion */}
        {task.autoScheduled && !isDone && (
          <div
            className={`${isShort ? 'hidden group-hover:flex' : 'flex'} mt-2 text-[10px] font-bold text-primary items-center gap-2 bg-primary/10 p-1.5 rounded-md pointer-events-auto transition-opacity`}
          >
            <span>✨ Suggestion</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAcceptAuto(task.id!);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="ml-auto bg-primary text-white px-2 py-0.5 rounded shadow-sm hover:bg-primary/80 transition-colors"
            >
              OK
            </button>
          </div>
        )}

        {/* Drag handle */}
        {!isDone && (
          <div className="absolute left-1/2 -top-1 -translate-x-1/2 w-8 h-1.5 bg-black/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        )}
      </div>
    </div>
  );
}

// --- Main Page ---

export default function TimelinePage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [days, setDays] = useState<Date[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    const saved = localStorage.getItem('taskie_scheduled_tasks');
    if (saved) {
      try {
        const parsedTasks: ScheduledTask[] = JSON.parse(saved);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTasks(parsedTasks);

        let baseDate = new Date();
        if (parsedTasks.length > 0) {
          const sortedStarts = parsedTasks
            .map((t) => parseISO(t.scheduledStart))
            .sort((a, b) => a.getTime() - b.getTime());
          if (sortedStarts[0] < baseDate) {
            baseDate = sortedStarts[0];
          }
        }

        // Toujours afficher une semaine du Lundi au Dimanche
        const firstDay = startOfWeek(baseDate, { weekStartsOn: 1 });
        const uniqueDays = Array.from({ length: 7 }).map((_, i) =>
          addDays(firstDay, i)
        );

        setDays(uniqueDays);
      } catch {
        console.error('Failed to parse scheduled tasks');
      }
    } else {
      const firstDay = startOfWeek(new Date(), { weekStartsOn: 1 });
      const uniqueDays = Array.from({ length: 7 }).map((_, i) =>
        addDays(firstDay, i)
      );

      setDays(uniqueDays);
    }
  }, []);

  const getTaskStyle = (task: ScheduledTask) => {
    const start = parseISO(task.scheduledStart);
    const taskMinStart = start.getHours() * 60 + start.getMinutes();
    const dayMinStart = MIN_HOUR * 60;

    const offsetMinutes = taskMinStart - dayMinStart;
    const topPx = (offsetMinutes / 60) * HOUR_HEIGHT;
    const heightPx = (task.duree_estimee / 60) * HOUR_HEIGHT;

    const colors = {
      1: 'bg-slate-50 border-slate-200 text-slate-800',
      2: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      3: 'bg-blue-50 border-blue-200 text-blue-800',
      4: 'bg-orange-50 border-orange-200 text-orange-900',
      5: 'bg-rose-50 border-rose-200 text-rose-900 shadow-[inset_0_0_0_1px_rgba(225,29,72,0.2)]',
    };

    const importance = Math.min(Math.max(task.importance || 3, 1), 5) as
      | 1
      | 2
      | 3
      | 4
      | 5;

    return {
      top: topPx,
      height: heightPx,
      className: colors[importance],
    };
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;

    if (!over) return;

    const task = active.data.current?.task as ScheduledTask;
    if (!task) return;

    const minutesDelta = Math.round(delta.y * (60 / HOUR_HEIGHT));
    const remainder = minutesDelta % 15;
    const snappedMinutesDelta =
      minutesDelta -
      remainder +
      (Math.abs(remainder) >= 7.5 ? Math.sign(minutesDelta) * 15 : 0);

    const targetDayISO = over.id as string;
    const targetDayDate = parseISO(targetDayISO);
    const originalStartDate = parseISO(task.scheduledStart);

    let newStart = addMinutes(originalStartDate, snappedMinutesDelta);

    if (!isSameDay(originalStartDate, targetDayDate)) {
      newStart = new Date(
        targetDayDate.getFullYear(),
        targetDayDate.getMonth(),
        targetDayDate.getDate(),
        newStart.getHours(),
        newStart.getMinutes()
      );
    }

    const newEnd = addMinutes(newStart, task.duree_estimee);

    const updatedTasks = tasks.map((t) => {
      if (t.id === task.id) {
        return {
          ...t,
          scheduledStart: newStart.toISOString(),
          scheduledEnd: newEnd.toISOString(),
        };
      }
      return t;
    });

    setTasks(updatedTasks);
    localStorage.setItem(
      'taskie_scheduled_tasks',
      JSON.stringify(updatedTasks)
    );
  };

  const handleSnooze = (taskId: string | undefined) => {
    if (!taskId) return;
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const start = addDays(parseISO(t.scheduledStart), 1);
        const end = addDays(parseISO(t.scheduledEnd), 1);
        return {
          ...t,
          scheduledStart: start.toISOString(),
          scheduledEnd: end.toISOString(),
        };
      }
      return t;
    });
    setTasks(updated);
    localStorage.setItem('taskie_scheduled_tasks', JSON.stringify(updated));
  };

  const handleDone = (taskId: string | undefined) => {
    if (!taskId) return;
    const updated = tasks.map((t) =>
      t.id === taskId
        ? { ...t, status: t.status === 'done' ? 'todo' : 'done' }
        : t
    );
    setTasks(updated);
    localStorage.setItem('taskie_scheduled_tasks', JSON.stringify(updated));
  };

  const handleAcceptAuto = (taskId: string | undefined) => {
    if (!taskId) return;
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, autoScheduled: false } : t
    );
    setTasks(updated);
    localStorage.setItem('taskie_scheduled_tasks', JSON.stringify(updated));
  };

  return (
    <div className="relative min-h-screen bg-slate-50 font-sans flex flex-col pt-8 pb-32 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern [mask-image:radial-gradient(ellipse_at_top,white,transparent_80%)] opacity-40" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 flex-grow flex flex-col gap-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Mon Emploi du Temps
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Généré par Taskie. <strong>Glissez et déposez</strong> une tâche
              pour la décaler.
            </p>
          </div>
          <Link
            href="/draft"
            className="rounded-full bg-white shadow-sm border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Refaire le brouillon
          </Link>
        </header>

        <DndContext
          sensors={sensors}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="overflow-x-auto custom-scrollbar flex flex-col">
              <div className="min-w-[1044px] flex flex-col">
                {/* Header Row (Days) - Scrollable on mobile */}
                <div className="flex border-b border-slate-100 bg-slate-50/50 pt-2">
                  <div className="w-16 flex-shrink-0 border-r border-slate-100 sticky left-0 bg-slate-50/50 z-40"></div>

                  {days.map((day, i) => (
                    <div
                      key={i}
                      className="flex-1 min-w-[140px] py-4 text-center border-r border-slate-100 flex flex-col shrink-0"
                    >
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {format(day, 'EEEE', { locale: fr })}
                      </span>
                      <span
                        className={`text-2xl font-black mt-1 ${isSameDay(day, new Date()) ? 'text-primary' : 'text-slate-800'}`}
                      >
                        {format(day, 'd')}
                      </span>
                      {isSameDay(day, new Date()) && (
                        <div className="mx-auto mt-1 h-1 w-1 rounded-full bg-primary"></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Grid Body */}
                <div
                  className="flex relative overflow-y-auto custom-scrollbar-y"
                  style={{ height: '70vh' }}
                >
                  {/* Time Labels Column */}
                  <div className="w-16 flex-shrink-0 border-r border-slate-100 bg-white relative z-30 sticky left-0">
                    {Array.from({ length: MAX_HOUR - MIN_HOUR + 1 }).map(
                      (_, i) => (
                        <div
                          key={i}
                          className="text-right pr-3 text-xs font-medium text-slate-400 -translate-y-2 relative"
                          style={{ height: `${HOUR_HEIGHT}px` }}
                        >
                          {`${MIN_HOUR + i}:00`}
                        </div>
                      )
                    )}
                  </div>

                  {/* Days Content Columns */}
                  <div className="flex flex-1 relative bg-white">
                    {/* Background horizontal lines for all hours */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col z-0 min-w-full">
                      {Array.from({ length: MAX_HOUR - MIN_HOUR }).map(
                        (_, i) => (
                          <div
                            key={i}
                            className="border-b border-slate-50 w-full"
                            style={{ height: `${HOUR_HEIGHT}px` }}
                          ></div>
                        )
                      )}
                    </div>

                    {/* Columns for each day */}
                    {days.map((day, dayIndex) => {
                      const dayTasks = tasks.filter(
                        (t) =>
                          t.scheduledStart &&
                          isSameDay(parseISO(t.scheduledStart), day)
                      );

                      return (
                        <DroppableDayColumn key={dayIndex} day={day}>
                          {dayTasks.map((task) => {
                            const style = getTaskStyle(task);
                            const isDone = task.status === 'done';

                            return (
                              <DraggableTaskCard
                                key={task.id}
                                task={task}
                                style={style}
                                isDone={isDone}
                                onSnooze={handleSnooze}
                                onDone={handleDone}
                                onAcceptAuto={handleAcceptAuto}
                              />
                            );
                          })}
                        </DroppableDayColumn>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DndContext>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
