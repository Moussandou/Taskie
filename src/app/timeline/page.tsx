'use client';

import { useEffect, useState } from 'react';
import { Task } from '@/domain/task.schema';
import Link from 'next/link';
import {
  format,
  parseISO,
  addDays,
  startOfDay,
  isSameDay,
  addMinutes,
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
}

const MIN_HOUR = 8; // 08:00
const MAX_HOUR = 20; // 20:00
const HOUR_HEIGHT = 80; // pixels per hour

// --- DND Components ---

// Wrapper pour chaque Journée (Colonne de drop)
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

// Wrapper pour chaque Tâche (Elément draggable)
function DraggableTaskCard({
  task,
  style,
  isDone,
  onSnooze,
  onDone,
}: {
  task: ScheduledTask;
  style: { top: string | number; height: string | number; className: string };
  isDone: boolean;
  onSnooze: (id: string) => void;
  onDone: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id || `task-${task.titre}`,
    data: { task },
    disabled: isDone, // On ne drag pas les tâches terminées
  });

  // Appliquer le transform (glissement visuel)
  const transformStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
        opacity: 0.9,
        boxShadow:
          '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      className={`absolute left-1.5 right-1.5 rounded-xl border p-3 flex flex-col shadow-sm transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing backdrop-blur-sm bg-opacity-95 overflow-hidden group ${style.className} ${isDone ? 'opacity-40 grayscale cursor-default' : ''}`}
      style={{ top: style.top, height: style.height, ...transformStyle }}
      {...listeners}
      {...attributes}
    >
      <div className="flex justify-between items-start mb-1 pointer-events-none">
        <div
          className={`text-[10px] font-bold uppercase tracking-widest opacity-60 ${isDone ? 'line-through' : ''}`}
        >
          {format(parseISO(task.scheduledStart), 'HH:mm')} -{' '}
          {format(parseISO(task.scheduledEnd), 'HH:mm')}
        </div>

        {/* Actions - Pointer events auto so they can be clicked */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onSnooze(task.id!);
            }}
            className="px-1.5 py-0.5 rounded-md hover:bg-black/5 text-slate-600 text-[10px] font-bold transition-colors"
            title="Snooze"
          >
            Zz
          </button>
          {!isDone && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDone(task.id!);
              }}
              className="px-1.5 py-0.5 rounded-md hover:bg-emerald-500/20 text-emerald-600 font-bold transition-colors"
              title="Marquer fait"
            >
              ✓
            </button>
          )}
        </div>
      </div>

      <h3
        className={`font-bold text-sm leading-tight mt-0.5 pointer-events-none ${isDone ? 'line-through opacity-70' : ''}`}
      >
        {task.titre}
      </h3>

      {task.duree_estimee >= 45 && (
        <div className="mt-auto flex items-center gap-2 text-[10px] font-semibold opacity-70 truncate pt-2 pointer-events-none">
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

      {/* Drag handle visual hint */}
      {!isDone && (
        <div className="absolute left-1/2 -top-1 -translate-x-1/2 w-8 h-1.5 bg-black/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      )}
    </div>
  );
}

// --- Main Page ---

export default function TimelinePage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [days, setDays] = useState<Date[]>([]);

  // Utiliser le PointerSensor pour ignorer les clics boutons
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires minimum 5px movement before drag starts (allows clicks on buttons)
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

        if (parsedTasks.length > 0) {
          const sortedStarts = parsedTasks
            .map((t) => parseISO(t.scheduledStart))
            .sort((a, b) => a.getTime() - b.getTime());
          const firstDay = startOfDay(sortedStarts[0]);
          const lastDay = startOfDay(sortedStarts[sortedStarts.length - 1]);

          let currentDay = firstDay;
          const uniqueDays: Date[] = [];

          while (currentDay <= lastDay && uniqueDays.length < 7) {
            uniqueDays.push(currentDay);
            currentDay = addDays(currentDay, 1);
          }

          setDays(
            uniqueDays.length > 0 ? uniqueDays : [startOfDay(new Date())]
          );
        } else {
          setDays([startOfDay(new Date())]);
        }
      } catch {
        console.error('Failed to parse scheduled tasks');
      }
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

    if (!over) return; // Dropped outside

    const task = active.data.current?.task as ScheduledTask;
    if (!task) return;

    // Calculate new start time based on pixel delta Y
    // delta.y is the pixel difference.
    // HOUR_HEIGHT px = 60 minutes
    // deltaMinutes = dropDeltaY * (60 / HOUR_HEIGHT)
    const minutesDelta = Math.round(delta.y * (60 / HOUR_HEIGHT));

    // Snap to 15 minute grids ideally, but let's just use raw minute delta and round to nearest 15
    const remainder = minutesDelta % 15;
    const snappedMinutesDelta =
      minutesDelta -
      remainder +
      (Math.abs(remainder) >= 7.5 ? Math.sign(minutesDelta) * 15 : 0);

    // Identify target day (if dragged across columns)
    const targetDayISO = over.id as string;
    const targetDayDate = parseISO(targetDayISO);
    const originalStartDate = parseISO(task.scheduledStart);

    // Create new Date
    let newStart = addMinutes(originalStartDate, snappedMinutesDelta);

    // If we changed columns, we need to apply the time relative to the new day
    if (!isSameDay(originalStartDate, targetDayDate)) {
      // Keep the hour/minute from newStart but apply target day
      newStart = new Date(
        targetDayDate.getFullYear(),
        targetDayDate.getMonth(),
        targetDayDate.getDate(),
        newStart.getHours(),
        newStart.getMinutes()
      );
    }

    // Ensure boundaries (e.g., don't drag earlier than 00:00 or later than 23:59, or within MIN/MAX HOUR if desired)
    // For now purely update the start/end
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
    alert(`Snooze de la tâche ${taskId}`);
    // Plus tard : appeler /api/reschedule
  };

  const handleDone = (taskId: string | undefined) => {
    if (!taskId) return;
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, status: 'done' } : t
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
        <header className="flex items-center justify-between">
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

        {/* DND Context wraps the calendar grid */}
        <DndContext
          sensors={sensors}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            {/* Header Row (Days) */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              <div className="w-16 flex-shrink-0 border-r border-slate-100"></div>

              {days.map((day, i) => (
                <div
                  key={i}
                  className="flex-1 py-4 text-center border-r border-slate-100 flex flex-col"
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
              className="flex relative overflow-y-auto"
              style={{ height: '70vh' }}
            >
              {/* Time Labels Column */}
              <div className="w-16 flex-shrink-0 border-r border-slate-100 bg-white relative z-20">
                {Array.from({ length: MAX_HOUR - MIN_HOUR + 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="text-right pr-3 text-xs font-medium text-slate-400 -translate-y-2 relative"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  >
                    {`${MIN_HOUR + i}:00`}
                  </div>
                ))}
              </div>

              {/* Days Content Columns */}
              <div className="flex flex-1 relative bg-white overflow-hidden">
                {/* Background horizontal lines for all hours */}
                <div className="absolute inset-0 pointer-events-none flex flex-col z-0">
                  {Array.from({ length: MAX_HOUR - MIN_HOUR }).map((_, i) => (
                    <div
                      key={i}
                      className="border-b border-slate-50 w-full"
                      style={{ height: `${HOUR_HEIGHT}px` }}
                    ></div>
                  ))}
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
                          />
                        );
                      })}
                    </DroppableDayColumn>
                  );
                })}
              </div>
            </div>
          </div>
        </DndContext>
      </main>
    </div>
  );
}
