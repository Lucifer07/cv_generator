import { redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { CredentialRepository } from '$lib/server/repositories/credential.repository';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.session) redirect(303, '/login');

	const credentialRepo = new CredentialRepository(getDb());
	const credential = await credentialRepo.getCredential(locals.session.userId);

	const hasCredentials = credential !== null;
	const required = !hasCredentials && url.pathname !== '/settings';

	return {
		email: locals.session.email,
		userId: locals.session.userId,
		hasCredentials,
		lastVerifiedAt: credential?.last_verified_at ?? null,
		endpoint: credential?.endpoint_url ?? null,
		settingsRequired: required
	};
};
