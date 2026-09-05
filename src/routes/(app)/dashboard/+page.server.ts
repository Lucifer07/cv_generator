import { fail, redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { ResumeRepository } from '$lib/server/repositories/resume.repository';
import { CredentialRepository } from '$lib/server/repositories/credential.repository';
import { completeChat } from '$lib/server/ai';
import { buildPrompt } from '$lib/server/ai/strategies';
import { emptyResumeData } from '$lib/schemas/resume';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session) redirect(303, '/login');

	const repo = new ResumeRepository(getDb());
	const resumes = await repo.findAllByUser(locals.session.userId);
	return { resumes };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated.' });
		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim() || 'Untitled resume';
		const seed: unknown = {
			basics: { fullName: '', headline: '', email: locals.session.email, summary: '' },
			experience: [],
			education: [],
			skills: [],
			projects: []
		};
		const repo = new ResumeRepository(getDb());
		let resume;
		try {
			resume = await repo.create(locals.session.userId, title, seed);
		} catch {
			return fail(409, { message: `A resume titled "${title}" already exists.` });
		}
		redirect(303, `/editor/${resume.id}`);
	},

	import: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated.' });
		const form = await request.formData();
		const file = form.get('file');
		const title = String(form.get('title') ?? '').trim() || 'Imported resume';
		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { message: 'No file selected.' });
		}
		if (file.size > 8 * 1024 * 1024) {
			return fail(413, { message: 'File exceeds 8 MB limit.' });
		}
		const SUPPORTED = new Set([
			'application/pdf',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'text/plain'
		]);
		if (!SUPPORTED.has(file.type)) {
			return fail(415, {
				message: 'Unsupported file type. Please upload a PDF, DOCX, or TXT document.'
			});
		}

		const credential = await new CredentialRepository(getDb()).getCredential(locals.session.userId);
		if (!credential) {
			return fail(412, {
				message: 'Import requires AI. Configure your AI endpoint and token in Settings first.'
			});
		}

		const buffer = new Uint8Array(await file.arrayBuffer());
		const { extractTextFromDocument } = await import('$lib/server/import/extract');
		const { resumeDataFromAiReply } = await import('$lib/server/import/parse');

		const text = await extractTextFromDocument(buffer, file.type);
		if (!text || text.trim().length < 5) {
			return fail(422, { message: 'Could not extract text from the document.' });
		}

		const prompt = buildPrompt({
			strategy: 'import',
			resume: emptyResumeData(),
			context: { customPrompt: text }
		});

		let reply: string;
		try {
			reply = await completeChat(locals.session.userId, {
				model: credential.model ?? undefined,
				messages: [
					{ role: 'system', content: prompt.system },
					{ role: 'user', content: prompt.user }
				],
				max_tokens: prompt.maxTokens,
				temperature: prompt.temperature
			});
		} catch (err) {
			return fail(502, {
				message: `AI request failed: ${err instanceof Error ? err.message : 'unknown error'}`
			});
		}

		const content = resumeDataFromAiReply(reply);
		if (!content) {
			return fail(502, {
				message:
					'The AI reply could not be parsed into resume fields. Try again or use a different model.'
			});
		}

		const repo = new ResumeRepository(getDb());
		let resume;
		try {
			resume = await repo.create(locals.session.userId, title, content);
		} catch {
			return fail(409, {
				message: `A resume titled "${title}" already exists. Rename it or pick another title.`
			});
		}
		redirect(303, `/editor/${resume.id}`);
	},

	delete: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated.' });
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		if (!id) return fail(400, { message: 'Missing id.' });
		const repo = new ResumeRepository(getDb());
		await repo.delete(id, locals.session.userId);
		return { deleted: true };
	}
};
