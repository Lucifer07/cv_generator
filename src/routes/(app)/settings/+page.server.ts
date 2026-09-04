import { fail } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { CredentialRepository } from '$lib/server/repositories/credential.repository';
import type { Actions, PageServerLoad } from './$types';

function normalizeEndpoint(value: string): string {
	return value.trim().replace(/\/+$/, '');
}

function isAcceptableEndpoint(value: string): boolean {
	if (!/^https?:\/\//i.test(value)) return false;
	if (!/^https:\/\//i.test(value)) {
		return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(value);
	}
	return true;
}

async function verifyEndpoint(
	endpoint: string,
	token: string,
	model: string | null
): Promise<
	{ ok: true; model: string | null } | { ok: false; status: number | null; message: string }
> {
	try {
		const resp = await fetch(`${endpoint}/models`, {
			method: 'GET',
			headers: { Authorization: `Bearer ${token}` }
		});
		if (resp.ok) {
			const data = (await resp.json().catch(() => null)) as {
				data?: Array<{ id?: string }>;
			} | null;
			const detected = data?.data?.find((m) => m.id)?.id ?? null;
			return { ok: true, model: model ?? detected };
		}
		return { ok: false, status: resp.status, message: `Upstream returned ${resp.status}` };
	} catch (err) {
		return {
			ok: false,
			status: null,
			message: err instanceof Error ? err.message : 'Could not reach the endpoint'
		};
	}
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session)
		return { hasCredential: false, endpoint: null, model: null, lastVerifiedAt: null };

	const repo = new CredentialRepository(getDb());
	const credential = await repo.getCredential(locals.session.userId);

	return {
		hasCredential: credential !== null,
		endpoint: credential?.endpoint_url ?? null,
		model: credential?.model ?? null,
		lastVerifiedAt: credential?.last_verified_at ?? null
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated.' });

		const form = await request.formData();
		const endpoint = normalizeEndpoint(String(form.get('endpoint') ?? ''));
		const token = String(form.get('token') ?? '').trim();
		const model = String(form.get('model') ?? '').trim() || null;

		if (!endpoint || !token) {
			return fail(400, { endpoint, model, message: 'Endpoint URL and token are required.' });
		}
		if (!isAcceptableEndpoint(endpoint)) {
			return fail(400, {
				endpoint,
				model,
				message: 'Endpoint must use https:// (or http://localhost for local models).'
			});
		}

		const verification = await verifyEndpoint(endpoint, token, model);
		if (!verification.ok) {
			return fail(400, {
				endpoint,
				model,
				message: `Could not verify credentials. ${verification.message}`
			});
		}

		const repo = new CredentialRepository(getDb());
		await repo.setCredential(locals.session.userId, endpoint, token, verification.model);

		return { success: true, endpoint, model: verification.model };
	},

	delete: async ({ locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated.' });
		const repo = new CredentialRepository(getDb());
		await repo.deleteCredential(locals.session.userId);
		return { deleted: true };
	}
};
