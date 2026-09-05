import { fail, redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { ResumeRepository } from '$lib/server/repositories/resume.repository';
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
		const resume = await repo.create(locals.session.userId, title, seed);
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
		const buffer = new Uint8Array(await file.arrayBuffer());
		const { extractTextFromDocument } = await import('$lib/server/import/extract');
		const { textToResumeData } = await import('$lib/server/import/parse');
		const text = await extractTextFromDocument(buffer, file.type);
		if (!text || text.trim().length < 5) {
			return fail(422, { message: 'Could not extract text from the document.' });
		}
		const content = textToResumeData(text);
		const repo = new ResumeRepository(getDb());
		const resume = await repo.create(locals.session.userId, title, content);
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
