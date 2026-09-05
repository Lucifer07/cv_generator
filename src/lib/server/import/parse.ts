import type { ResumeData } from '$lib/schemas/resume';
import { resumeDataSchema } from '$lib/schemas/resume';

/**
 * Parse the AI model's reply into ResumeData. Tolerates markdown fences and
 * surrounding prose by extracting the outermost JSON object. Returns null if
 * the reply does not contain schema-valid JSON.
 */
export function resumeDataFromAiReply(reply: string): ResumeData | null {
	const withoutFences = reply.replace(/```(?:json)?/gi, '');
	const start = withoutFences.indexOf('{');
	const end = withoutFences.lastIndexOf('}');
	if (start === -1 || end === -1 || end <= start) return null;
	let parsed: unknown;
	try {
		parsed = JSON.parse(withoutFences.slice(start, end + 1));
	} catch {
		return null;
	}
	const result = resumeDataSchema.safeParse(parsed);
	if (!result.success) return null;
	return result.data;
}
