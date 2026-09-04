import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { getDb } from '../db';

const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 2 ** 14;

export interface UserRecord {
	id: string;
	email: string;
	password_hash: string;
	created_at: string;
}

export function hashPassword(plain: string): string {
	const salt = randomBytes(16);
	const derived = scryptSync(plain, salt, SCRYPT_KEYLEN, { N: SCRYPT_COST });
	return `scrypt$${SCRYPT_COST}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
	const [scheme, costStr, saltB64, hashB64] = stored.split('$');
	if (scheme !== 'scrypt' || !costStr || !saltB64 || !hashB64) return false;
	const cost = Number.parseInt(costStr, 10);
	if (!Number.isFinite(cost)) return false;
	const salt = Buffer.from(saltB64, 'base64');
	const expected = Buffer.from(hashB64, 'base64');
	const derived = scryptSync(plain, salt, expected.length, { N: cost });
	return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
	const row = await getDb()
		.selectFrom('users')
		.selectAll()
		.where('email', '=', email.toLowerCase())
		.executeTakeFirst();
	return (row as UserRecord | undefined) ?? null;
}

export async function createUser(email: string, password: string): Promise<UserRecord> {
	const passwordHash = hashPassword(password);
	const row = await getDb()
		.insertInto('users')
		.values({
			id: crypto.randomUUID(),
			email: email.toLowerCase(),
			password_hash: passwordHash,
			created_at: new Date().toISOString()
		})
		.returningAll()
		.executeTakeFirstOrThrow();
	return row as UserRecord;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
	const row = await getDb().selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst();
	return (row as UserRecord | undefined) ?? null;
}
