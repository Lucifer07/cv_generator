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
