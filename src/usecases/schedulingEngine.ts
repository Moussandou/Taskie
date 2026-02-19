import { Task } from '@/domain/task.schema';

export interface TimeBlock {
  start: Date;
  end: Date;
  durationMinutes: number;
}

export interface Constraint {
  id: string;
  start: Date;
  end: Date;
  title: string;
}

export interface SchedulingSettings {
  workStartString: string; // "09:00"
  workEndString: string; // "18:00"
  daysToSchedule: number; // Combien de jours futurs on provisionne (ex: 7)
  baseDate: Date; // Date de début du calcul (souvent "aujourd'hui")
}

export interface ScheduledTask extends Task {
  scheduledStart: string; // ISO String
  scheduledEnd: string; // ISO String
  autoScheduled?: boolean;
}

export class SchedulingEngine {
  constructor(
    private settings: SchedulingSettings,
    private constraints: Constraint[] = []
  ) {}

  private parseTime(date: Date, timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  }

  private parseDateString(dateStr: string): Date {
    // Assume format YYYY-MM-DD
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date();
    d.setFullYear(year, month - 1, day);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private isSameDay(d1: Date, d2: Date) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  /**
   * Génère les blocs libres quotidiens pour un nombre de jours donné,
   * en soustrayant les contraintes (ex: événements calendrier).
   */
  private generateFreeBlocks(
    startDate: Date,
    days: number
  ): Record<string, TimeBlock[]> {
    const blocksByDay: Record<string, TimeBlock[]> = {};

    for (let i = 0; i < days; i++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(currentDay.getDate() + i);
      const dateKey = currentDay.toISOString().split('T')[0];

      let dayStart = this.parseTime(currentDay, this.settings.workStartString);
      const dayEnd = this.parseTime(currentDay, this.settings.workEndString);

      // Ne planifier qu'à partir de "maintenant" si le jour est aujourd'hui
      const now = new Date();
      if (this.isSameDay(currentDay, now) && now > dayStart) {
        dayStart = now < dayEnd ? now : dayEnd;
      }

      // Récupérer et trier les contraintes pour ce jour précis
      const dayConstraints = this.constraints
        .filter((c) => this.isSameDay(c.start, currentDay))
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      const freeBlocks: TimeBlock[] = [];
      let currentCursor = new Date(dayStart);

      for (const constraint of dayConstraints) {
        // Si la contrainte coupe notre journée de travail
        if (constraint.start > currentCursor && constraint.start < dayEnd) {
          const diffMs = constraint.start.getTime() - currentCursor.getTime();
          const durationMinutes = Math.floor(diffMs / 60000);
          if (durationMinutes > 0) {
            freeBlocks.push({
              start: new Date(currentCursor),
              end: new Date(constraint.start),
              durationMinutes,
            });
          }
        }
        // Avancer le curseur à la fin de la contrainte si elle dépasse le curseur actuel
        if (constraint.end > currentCursor) {
          currentCursor = new Date(constraint.end);
        }
      }

      // Ajouter le dernier bloc jusqu'à workEnd
      if (currentCursor < dayEnd) {
        const diffMs = dayEnd.getTime() - currentCursor.getTime();
        const durationMinutes = Math.floor(diffMs / 60000);
        if (durationMinutes > 0) {
          freeBlocks.push({
            start: new Date(currentCursor),
            end: new Date(dayEnd),
            durationMinutes,
          });
        }
      }

      blocksByDay[dateKey] = freeBlocks;
    }

    return blocksByDay;
  }

  /**
   * Applique l'algorithme complet sur la liste des tâches
   */
  public scheduleTasks(tasks: Task[]): ScheduledTask[] {
    // 1. Initialisation des blocs libres
    const freeBlocksByDay = this.generateFreeBlocks(
      this.settings.baseDate,
      this.settings.daysToSchedule
    );

    // Jours disponibles triés chronologiquement
    const availableDays = Object.keys(freeBlocksByDay).sort();

    // 2. Tri heuristique des tâches
    const sortedTasks = [...tasks].sort((a, b) => {
      // Priorité Absolue : Les tâches avec Date
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;

      // Si même date (ou les deux n'ont pas de date)
      if (a.date && b.date && a.date !== b.date) {
        return a.date.localeCompare(b.date); // Ordre chronologique des dates
      }

      // Priorité (Importance decroissante)
      if (a.importance !== b.importance) {
        return b.importance - a.importance;
      }

      // Durée (Décroissante : on case les grosses pierres d'abord - First Fit Decreasing)
      return b.duree_estimee - a.duree_estimee;
    });

    const scheduledTasks: ScheduledTask[] = [];

    // 3. Placement (Bin Packing)
    for (const task of sortedTasks) {
      let placed = false;

      // Déterminer la liste des jours où on le droit de placer cette tâche
      let targetDays = availableDays;

      if (task.date) {
        // Normaliser la date (si elle contient une heure ISO ou un autre format)
        let formattedDate = task.date;
        if (formattedDate.includes('T')) {
          formattedDate = formattedDate.split('T')[0];
        } else if (formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Déjà au bon format
        } else {
          // Essayer de parser si c'est un format bizarre
          try {
            const d = new Date(formattedDate);
            if (!isNaN(d.getTime())) {
              formattedDate = d.toISOString().split('T')[0];
            }
          } catch (e) {}
        }

        // Si on trouve ce jour précis
        if (availableDays.includes(formattedDate)) {
          targetDays = [formattedDate];
        } else {
          // Fallback sur tous les jours disponibles
          targetDays = availableDays;
        }
      }

      // Chercher séquentiellement dans les blocs libres
      for (const day of targetDays) {
        if (placed) break;

        const blocks = freeBlocksByDay[day];

        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i];

          // Vérifier si le bloc est assez grand
          if (block.durationMinutes >= task.duree_estimee) {
            const taskStart = new Date(block.start);
            const taskEnd = new Date(
              block.start.getTime() + task.duree_estimee * 60000
            );

            scheduledTasks.push({
              ...task,
              scheduledStart: taskStart.toISOString(),
              scheduledEnd: taskEnd.toISOString(),
              autoScheduled: !task.date,
            });

            // Amputer/Réduire le bloc
            block.start = taskEnd;
            block.durationMinutes -= task.duree_estimee;
            placed = true;
            break;
          }
        }
      }

      if (!placed && targetDays.length === 1 && task.date) {
        // Échec de placement sur le jour précis. On force le fallback sur la semaine entière
        for (const day of availableDays) {
          if (placed) break;
          const blocks = freeBlocksByDay[day];
          for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            if (block.durationMinutes >= task.duree_estimee) {
              const taskStart = new Date(block.start);
              const taskEnd = new Date(
                block.start.getTime() + task.duree_estimee * 60000
              );
              scheduledTasks.push({
                ...task,
                scheduledStart: taskStart.toISOString(),
                scheduledEnd: taskEnd.toISOString(),
                autoScheduled: true, // Marqué comme autosuggestion car déplacé
              });
              block.start = taskEnd;
              block.durationMinutes -= task.duree_estimee;
              placed = true;
              break;
            }
          }
        }
      }

      if (!placed) {
        console.warn(
          `Impossible de placer la tâche : ${task.titre}. Elle dépasse probablement la taille max d'un bloc libre !`
        );
      }
    }

    return scheduledTasks;
  }
}
