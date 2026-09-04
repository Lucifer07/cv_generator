import { fail, redirect } from '@sveltejs/kit';
import { createUser, findUserByEmail } from '$lib/server/repositories/user.repository';
import { createSessionToken, sessionCookieName, sessionTtlSeconds } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();
		const password = String(form.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { email, message: 'Email and password are required.' });
		}
		if (password.length < 8) {
			return fail(400, { email, message: 'Password must be at least 8 characters.' });
		}

		const existing = await findUserByEmail(email);
		if (existing) {
			return fail(409, { email, message: 'An account with that email already exists.' });
		}

		const user = await createUser(email, password);
		const token = createSessionToken(user.id, user.email);
		cookies.set(sessionCookieName, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env['NODE_ENV'] === 'production',
			maxAge: sessionTtlSeconds
		});

		redirect(303, '/dashboard');
	}
};
