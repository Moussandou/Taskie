import { GoogleGenAI, Type } from '@google/genai';

export async function parseBrainDump(text: string) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing in env vars.');
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Transformez ce texte libre décrivant une journée en une liste de tâches structurées.
Si certaines choses sont ambiguës (ex: durée non précisée pour une tâche complexe), renvoyez des questions.
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
