import type { ResumeData } from '$lib/schemas/resume';
import { resumeDataSchema } from '$lib/schemas/resume';

/**
 * Parse the AI model's reply into ResumeData. Tolerates markdown fences and
 * surrounding prose by extracting the outermost JSON object. Returns null if
 * the reply does not contain schema-valid JSON.
 */
export function resumeDataFromAiReply(reply: string): ResumeData | null {
	const withoutFences = reply.replace(/```(?:json)?/gi, '');
	// Reasoning models sometimes inline their thinking in the content itself.
	const withoutThink = withoutFences.replace(/<think>[\s\S]*?<\/think>/gi, '');
	const haystack = withoutThink.length > withoutFences.length ? withoutFences : withoutThink;
	const start = haystack.indexOf('{');
	const end = haystack.lastIndexOf('}');
	if (start === -1 || end === -1 || end <= start) return null;
	let parsed: unknown;
	try {
		parsed = JSON.parse(haystack.slice(start, end + 1));
	} catch {
		return null;
	}
	const result = resumeDataSchema.safeParse(parsed);
	if (!result.success) return null;
	return result.data;
}
