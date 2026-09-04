import { error, fail, json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { ResumeRepository } from '$lib/server/repositories/resume.repository';
import { CredentialRepository } from '$lib/server/repositories/credential.repository';
import { parseResumeContent } from '$lib/schemas/resume';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.session) throw error(401, 'Not authenticated');
	const resumeRepo = new ResumeRepository(getDb());
	const resume = await resumeRepo.findByIdAndUser(params.id, locals.session.userId);
	if (!resume) throw error(404, 'Resume not found');

	const credential = await new CredentialRepository(getDb()).getCredential(locals.session.userId);
	const hasCredentials = credential !== null;

	return {
		resume: {
			id: resume.id,
			title: resume.title,
			content: parseResumeContent(resume.content),
			updatedAt: resume.updated_at
		},
		hasCredentials,
		defaultModel: credential?.model ?? null
	};
};

export const actions: Actions = {
	save: async ({ request, locals, params }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const body = (await request.json()) as { content?: unknown; title?: string };
		const data = parseResumeContent(body.content);

		const repo = new ResumeRepository(getDb());
		const updated = await repo.updateContent(params.id, locals.session.userId, data);
		if (body.title && body.title !== updated.title) {
			await repo.updateTitle(
				params.id,
				locals.session.userId,
				body.title.trim() || 'Untitled resume'
			);
		}
		return json({ ok: true, updatedAt: updated.updated_at });
	},

	rename: async ({ request, locals, params }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim() || 'Untitled resume';
		const repo = new ResumeRepository(getDb());
		await repo.updateTitle(params.id, locals.session.userId, title);
		return { ok: true, title };
	}
};
