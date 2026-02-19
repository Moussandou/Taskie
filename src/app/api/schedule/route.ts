import { NextResponse } from 'next/server';
import {
  SchedulingEngine,
  SchedulingSettings,
} from '@/usecases/schedulingEngine';
import { Task } from '@/domain/task.schema';
import { adminDb } from '@/infra/firebase/admin';

export async function POST(req: Request) {
  try {
    const { tasks, workStart, workEnd } = await req.json();

    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json(
        { error: 'Tasks array is required' },
        { status: 400 }
      );
    }

    // Configuration du moteur pour l'utilisateur
    const settings: SchedulingSettings = {
      workStartString: workStart || '09:00',
      workEndString: workEnd || '18:00',
      daysToSchedule: 7, // On prévoit une semaine max d'écoulement pour l'instant
      baseDate: new Date(),
    };

    // Note: Ici nous devrions récupérer les 'Constraints' (RDV Google Calendar, etc) depuis Firebase.
    // Pour cette V1, on envoie un tableau vide de contraintes fixes.
    const engine = new SchedulingEngine(settings, []);

    // Exécution de l'algorithme
    const scheduledTasks = engine.scheduleTasks(tasks as Task[]);

    // TODO: Gérer l'authentification (userId) pour la sauvegarde.
    // Pour l'instant, on génère un mock UID si l'app n'a pas encore de système de login complet.
    const userId = 'anonymous_user';

    const batch = adminDb.batch();

    for (const task of scheduledTasks) {
      // Créer une reférence de document. Si id existe on l'utilise, sinon un nouveau.
      const docRef = task.id
        ? adminDb.collection('tasks').doc(task.id)
        : adminDb.collection('tasks').doc();

      // Assurez-vous que la tâche a bien un ID pour le client ensuite
      const finalTask = {
        ...task,
        id: docRef.id,
        userId,
        status: 'todo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      batch.set(docRef, finalTask, { merge: true });
    }

    await batch.commit();

    return NextResponse.json({
      message: 'Planning généré et sauvegardé avec succès',
      count: scheduledTasks.length,
      // scheduledTasks, // Optionnel: on peut retourner la liste pour que le state client se mette à jour directement
    });
  } catch (error: unknown) {
    console.error('API Schedule Error:', error);
    const msg =
      error instanceof Error ? error.message : 'Failed to schedule tasks';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
