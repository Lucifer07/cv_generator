import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { streamChat, loadCredential } from '$lib/server/ai';
import { buildPrompt } from '$lib/server/ai/strategies';
import { resumeDataSchema } from '$lib/schemas/resume';
import { getServerConfig } from '$lib/server/env';
import type { RequestHandler } from './$types';

const bodySchema = z.object({
	strategy: z.enum(['summary', 'rewrite', 'tailor', 'review', 'chat']),
	resume: resumeDataSchema,
	context: z
		.object({
			targetRole: z.string().optional(),
			jobDescription: z.string().optional(),
			selectedBullets: z.array(z.string()).optional(),
			customPrompt: z.string().optional()
		})
		.optional(),
	model: z.string().optional()
});

const buckets = new Map<string, { count: number; resetAt: number }>();

function checkRate(userId: string, rpm: number): boolean {
	const now = Date.now();
	const bucket = buckets.get(userId);
	if (!bucket || bucket.resetAt < now) {
		buckets.set(userId, { count: 1, resetAt: now + 60_000 });
		return true;
	}
	if (bucket.count >= rpm) return false;
	bucket.count += 1;
	return true;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.session) throw error(401, 'Not authenticated');
	const cfg = await loadCredential(locals.session.userId);
	if (!cfg) {
		return json(
			{ error: 'AI credentials are not configured. Add them in Settings.' },
			{ status: 412 }
		);
	}

	const rpm = getServerConfig().rateLimitRpm;
	if (!checkRate(locals.session.userId, rpm)) {
		return json({ error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 });
	}

	const raw = (await request.json().catch(() => null)) as unknown;
	const parsed = bodySchema.safeParse(raw);
	if (!parsed.success) {
		return json({ error: 'Invalid request body', details: parsed.error.issues }, { status: 400 });
	}

	let prompt;
	try {
		prompt = buildPrompt({
			strategy: parsed.data.strategy,
			resume: parsed.data.resume,
			context: parsed.data.context
		});
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : 'Invalid strategy context' },
			{ status: 400 }
		);
	}

	const upstream = await streamChat(
		locals.session.userId,
		{
			model: parsed.data.model ?? cfg.model ?? undefined,
			messages: [
				{ role: 'system', content: prompt.system },
				{ role: 'user', content: prompt.user }
			],
			max_tokens: prompt.maxTokens,
			temperature: prompt.temperature
		},
		request.signal
	);

	const encoder = new TextEncoder();
	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			const reader = upstream.getReader();
			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					const text = value.choices.map((c) => c.delta?.content ?? '').join('');
					if (text) controller.enqueue(encoder.encode(text));
				}
				controller.close();
			} catch (err) {
				controller.error(err);
			}
		},
		cancel() {
			void upstream.cancel();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'no-cache',
			'X-Accel-Buffering': 'no'
		}
	});
};
