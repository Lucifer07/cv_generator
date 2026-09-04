import type { Handle } from '@sveltejs/kit';
import { initEncryptionKey } from '$lib/server/ai/crypto';
import { sessionCookieName, verifySessionToken } from '$lib/server/auth';
import { getServerConfig } from '$lib/server/env';

let booted = false;

function ensureBoot(): void {
	if (booted) return;
	const config = getServerConfig();
	initEncryptionKey(config.aiTokenEncKey);
	booted = true;
}

export const handle: Handle = async ({ event, resolve }) => {
	ensureBoot();

	const token = event.cookies.get(sessionCookieName);
	event.locals.session = null;

	if (token) {
		const payload = verifySessionToken(token);
		if (payload) {
			event.locals.session = { userId: payload.userId, email: payload.email };
		} else {
			event.cookies.delete(sessionCookieName, { path: '/' });
		}
	}

	return resolve(event);
};
