import { GoogleGenAI, Type } from '@google/genai';

export async function parseBrainDump(text: string) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing in env vars.');
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const today = new Date().toISOString().split('T')[0];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Nous sommes aujourd'hui le ${today}.
Transformez ce texte libre décrivant votre emploi du temps en une liste de tâches structurées.
Si une date spécifique est mentionnée (ex: "vendredi", "le 12") ou si une tâche s'y prête mieux, déduisez sa date précise (YYYY-MM-DD) en fonction d'aujourd'hui. Laissez null si la tâche est valide n'importe quand.
Si certaines choses sont ambiguës (ex: durée non précisée), renvoyez des questions.
Texte : "${text}"`,
    config: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                titre: { type: Type.STRING },
                duree_estimee: {
                  type: Type.INTEGER,
                  description: 'Durée en minutes',
                },
                importance: { type: Type.INTEGER, description: '1 à 5' },
                deadline: { type: Type.STRING, nullable: true },
                date: { type: Type.STRING, nullable: true },
                contexte: {
                  type: Type.STRING,
                  enum: ['phone', 'pc', 'home', 'outside', 'any'],
                },
                energie: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
                flexibilite: { type: Type.STRING, enum: ['fixed', 'flexible'] },
              },
              required: [
                'titre',
                'duree_estimee',
                'importance',
                'contexte',
                'energie',
                'flexibilite',
              ],
            },
          },
          questions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['tasks'],
      },
    },
  });

  const rawJson = response.text || '{}';
  return JSON.parse(rawJson);
}
