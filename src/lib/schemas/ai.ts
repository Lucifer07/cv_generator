import { z } from 'zod';
import { educationItemSchema, experienceItemSchema, projectItemSchema } from './resume';

const indexSchema = z.coerce.number().int().min(0);

export const editActionSchema = z.discriminatedUnion('op', [
	z.object({
		op: z.literal('set_basics'),
		fields: z
			.object({
				fullName: z.string().optional(),
				headline: z.string().optional(),
				email: z.string().optional(),
				phone: z.string().optional(),
				location: z.string().optional(),
				website: z.string().optional()
			})
			.strip()
	}),
	z.object({ op: z.literal('set_summary'), value: z.string() }),
	z.object({ op: z.literal('add_experience'), item: experienceItemSchema }),
	z.object({
		op: z.literal('update_experience'),
		index: indexSchema,
		item: experienceItemSchema.partial()
	}),
	z.object({ op: z.literal('remove_experience'), index: indexSchema }),
	z.object({ op: z.literal('add_education'), item: educationItemSchema }),
	z.object({
		op: z.literal('update_education'),
		index: indexSchema,
		item: educationItemSchema.partial()
	}),
	z.object({ op: z.literal('remove_education'), index: indexSchema }),
	z.object({ op: z.literal('set_skills'), items: z.array(z.string()) }),
	z.object({ op: z.literal('add_project'), item: projectItemSchema }),
	z.object({
		op: z.literal('update_project'),
		index: indexSchema,
		item: projectItemSchema.partial()
	}),
	z.object({ op: z.literal('remove_project'), index: indexSchema })
]);

export type EditAction = z.infer<typeof editActionSchema>;

export const assistantResponseSchema = z.object({
	reply: z.string().default(''),
	actions: z.array(editActionSchema).default([])
});

export type AssistantResponse = z.infer<typeof assistantResponseSchema>;

/**
 * Extract an AssistantResponse from a raw model reply. Tolerates markdown
 * fences, <think> blocks, and surrounding prose. Returns null when the reply
 * does not contain schema-valid JSON — the caller then treats it as plain text.
 */
export function parseAssistantResponse(raw: string): AssistantResponse | null {
	const cleaned = raw.replace(/```(?:json)?/gi, '').replace(/<think>[\s\S]*?<\/think>/gi, '');
	const start = cleaned.indexOf('{');
	const end = cleaned.lastIndexOf('}');
	if (start === -1 || end === -1 || end <= start) return null;
	let parsed: unknown;
	try {
		parsed = JSON.parse(cleaned.slice(start, end + 1));
	} catch {
		return null;
	}
	const result = assistantResponseSchema.safeParse(parsed);
	if (!result.success) return null;
	return result.data;
}
