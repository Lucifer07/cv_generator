import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { getServerConfig } from './env';

const SESSION_COOKIE = 'cv_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface SessionPayload {
	userId: string;
	email: string;
	expiresAt: number;
}

function sign(data: string): string {
	const secret = getServerConfig().sessionSecret;
	return createHmac('sha256', secret).update(data).digest('base64url');
}

export function createSessionToken(userId: string, email: string): string {
	const payload: SessionPayload = {
		userId,
		email,
		expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
	};
	const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
	const signature = sign(encoded);
	return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
	const [encoded, signature] = token.split('.');
	if (!encoded || !signature) return null;

	const expected = sign(encoded);
	const a = Buffer.from(signature);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

	try {
		const payload = JSON.parse(
			Buffer.from(encoded, 'base64url').toString('utf8')
		) as SessionPayload;
		if (payload.expiresAt < Math.floor(Date.now() / 1000)) return null;
		return payload;
	} catch {
		return null;
	}
}

export const sessionCookieName = SESSION_COOKIE;
export const sessionTtlSeconds = SESSION_TTL_SECONDS;
export const secureToken = (): string => randomBytes(32).toString('base64url');
