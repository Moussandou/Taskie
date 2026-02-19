import { NextResponse } from 'next/server';
import { parseBrainDump } from '@/infra/ai/parser';
import { ParseResultSchema } from '@/domain/task.schema';

export async function POST(req: Request) {
  try {
    const { dump } = await req.json();

    if (!dump) {
      return NextResponse.json({ error: 'No dump provided' }, { status: 400 });
    }

    const rawData = await parseBrainDump(dump);

    // Validate with Zod before responding
    const validatedData = ParseResultSchema.parse(rawData);

    // Assign temporary IDs if some are missing
    validatedData.tasks = validatedData.tasks.map((t) => ({
      ...t,
      id: t.id || crypto.randomUUID(),
    }));

    return NextResponse.json(validatedData);
  } catch (error: unknown) {
    console.error('Parse Error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to parse dump';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
