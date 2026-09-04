import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

let encryptionKey: Buffer | null = null;

export function initEncryptionKey(keyBase64: string): void {
	const key = Buffer.from(keyBase64, 'base64');
	if (key.length !== KEY_LENGTH) {
		throw new Error('AI_TOKEN_ENC_KEY must decode to 32 bytes');
	}
	encryptionKey = key;
}

function ensureKeyInitialized(): Buffer {
	if (encryptionKey) return encryptionKey;
	const envKey = process.env['AI_TOKEN_ENC_KEY'];
	if (!envKey) throw new Error('AI_TOKEN_ENC_KEY is not set');
	initEncryptionKey(envKey);
	return encryptionKey!;
}

const AAD = Buffer.from('cv-generator-ai-credentials', 'utf8');

export interface EncryptedToken {
	ciphertext: string;
	nonce: string;
}

export function encryptToken(plaintext: string): EncryptedToken {
	const key = ensureKeyInitialized();
	const nonce = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, nonce);
	cipher.setAAD(AAD);
	const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
	const tag = cipher.getAuthTag();
	return {
		ciphertext: Buffer.concat([encrypted, tag]).toString('base64'),
		nonce: nonce.toString('base64')
	};
}

export function decryptToken(ciphertextBase64: string, nonceBase64: string): string {
	const key = ensureKeyInitialized();
	const nonce = Buffer.from(nonceBase64, 'base64');
	const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, nonce);
	decipher.setAAD(AAD);
	const combined = Buffer.from(ciphertextBase64, 'base64');
	if (combined.length < TAG_LENGTH) throw new Error('ciphertext too short');
	const encrypted = combined.subarray(0, combined.length - TAG_LENGTH);
	const tag = combined.subarray(combined.length - TAG_LENGTH);
	decipher.setAuthTag(tag);
	const plain = Buffer.concat([decipher.update(encrypted), decipher.final()]);
	return plain.toString('utf8');
}
