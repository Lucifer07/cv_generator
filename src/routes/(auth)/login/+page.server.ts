import { fail, redirect } from '@sveltejs/kit';
import { findUserByEmail, verifyPassword } from '$lib/server/repositories/user.repository';
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

		const user = await findUserByEmail(email);
		if (!user || !verifyPassword(password, user.password_hash)) {
			return fail(400, { email, message: 'Invalid email or password.' });
		}

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
