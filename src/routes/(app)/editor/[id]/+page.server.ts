import { error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { ResumeRepository } from '$lib/server/repositories/resume.repository';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.session) throw error(401, 'Not authenticated');
	const repo = new ResumeRepository(getDb());
	const resume = await repo.findByIdAndUser(params.id, locals.session.userId);
	if (!resume) throw error(404, 'Resume not found');
	return { resume };
};
