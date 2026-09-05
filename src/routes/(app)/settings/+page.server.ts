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
	model: string
): Promise<
	| { ok: true; detected: string | null; model: string }
	| { ok: false; status: number | null; message: string }
> {
	try {
		const resp = await fetch(`${endpoint}/models`, {
			method: 'GET',
			headers: { Authorization: `Bearer ${token}` },
			signal: AbortSignal.timeout(15_000)
		});
		if (resp.ok) {
			const data = (await resp.json().catch(() => null)) as {
				data?: Array<{ id?: string }>;
			} | null;
			const detected = data?.data?.find((m) => typeof m.id === 'string')?.id ?? null;
			return { ok: true, detected, model };
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
	test: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated.' });

		const form = await request.formData();
		const endpoint = normalizeEndpoint(String(form.get('endpoint') ?? ''));
		const token = String(form.get('token') ?? '').trim();
		const model = String(form.get('model') ?? '').trim();

		if (!endpoint) {
			return fail(400, { endpoint, model, message: 'Endpoint URL is required.' });
		}
		if (!model) {
			return fail(400, { endpoint, model, message: 'Model is required.' });
		}
		if (!isAcceptableEndpoint(endpoint)) {
			return fail(400, {
				endpoint,
				model,
				message: 'Endpoint must use https:// (or http://localhost for local models).'
			});
		}

		if (!token) {
			const existing = await new CredentialRepository(getDb()).getCredential(locals.session.userId);
			if (!existing) {
				return fail(400, { endpoint, model, message: 'API token is required.' });
			}
			// Re-using stored token: decrypt and verify
			const { decryptToken } = await import('$lib/server/ai/crypto');
			let plainToken: string;
			try {
				plainToken = decryptToken(existing.api_token_cipher, existing.api_token_nonce);
			} catch {
				return fail(400, {
					endpoint,
					model,
					message: 'Stored token is unreadable. Please re-enter it.'
				});
			}
			const verification = await verifyEndpoint(endpoint, plainToken, model);
			if (!verification.ok) {
				return fail(400, {
					endpoint,
					model,
					message: `Could not verify credentials. ${verification.message}`
				});
			}
			return {
				verified: true,
				endpoint,
				model: verification.model,
				modelId: verification.detected
			};
		}

		const verification = await verifyEndpoint(endpoint, token, model);
		if (!verification.ok) {
			return fail(400, {
				endpoint,
				model,
				message: `Could not verify credentials. ${verification.message}`
			});
		}
		return { verified: true, endpoint, model: verification.model, modelId: verification.detected };
	},

	save: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated.' });

		const form = await request.formData();
		const endpoint = normalizeEndpoint(String(form.get('endpoint') ?? ''));
		const token = String(form.get('token') ?? '').trim();
		const model = String(form.get('model') ?? '').trim();

		if (!endpoint) {
			return fail(400, { endpoint, model, message: 'Endpoint URL is required.' });
		}
		if (!model) {
			return fail(400, { endpoint, model, message: 'Model is required.' });
		}
		if (!isAcceptableEndpoint(endpoint)) {
			return fail(400, {
				endpoint,
				model,
				message: 'Endpoint must use https:// (or http://localhost for local models).'
			});
		}

		const repo = new CredentialRepository(getDb());
		if (!token) {
			const existing = await repo.getCredential(locals.session.userId);
			if (!existing) {
				return fail(400, { endpoint, model, message: 'API token is required.' });
			}
		}

		const verification = await verifyEndpoint(endpoint, token || 'placeholder', model);
		if (!verification.ok) {
			return fail(400, {
				endpoint,
				model,
				message: `Could not verify credentials. ${verification.message}`
			});
		}

		if (token) {
			await repo.setCredential(locals.session.userId, endpoint, token, verification.model ?? model);
		} else {
			// Update endpoint and model without changing the cipher
			const existing = await repo.getCredential(locals.session.userId);
			if (!existing) return fail(400, { endpoint, model, message: 'No existing credentials.' });
			// Use repo's internal API by re-encrypting with same token
			const { decryptToken } = await import('$lib/server/ai/crypto');
			const plain = decryptToken(existing.api_token_cipher, existing.api_token_nonce);
			await repo.setCredential(locals.session.userId, endpoint, plain, verification.model ?? model);
		}

		return { success: true, endpoint, model: verification.model ?? model };
	},

	delete: async ({ locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated.' });
		const repo = new CredentialRepository(getDb());
		await repo.deleteCredential(locals.session.userId);
		return { deleted: true };
	}
};
