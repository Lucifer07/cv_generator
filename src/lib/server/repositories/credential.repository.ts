import type { Kysely } from 'kysely';
import type { DB } from '../db/types';
import { decryptToken, encryptToken } from '../ai/crypto';

export interface CredentialRow {
	user_id: string;
	endpoint_url: string;
	api_token_cipher: string;
	api_token_nonce: string;
	model: string | null;
	last_verified_at: string | null;
	updated_at: string;
}

export class CredentialRepository {
	readonly #db: Kysely<DB>;

	constructor(db: Kysely<DB>) {
		this.#db = db;
	}

	async setCredential(
		userId: string,
		endpointUrl: string,
		apiToken: string,
		model: string | null
	): Promise<CredentialRow> {
		const { ciphertext, nonce } = encryptToken(apiToken);
		const now = new Date().toISOString();

		const existing = await this.getCredential(userId);
		if (existing) {
			await this.#db
				.updateTable('ai_credentials')
				.set({
					endpoint_url: endpointUrl,
					api_token_cipher: ciphertext,
					api_token_nonce: nonce,
					model,
					last_verified_at: now,
					updated_at: now
				})
				.where('user_id', '=', userId)
				.execute();
		} else {
			await this.#db
				.insertInto('ai_credentials')
				.values({
					user_id: userId,
					endpoint_url: endpointUrl,
					api_token_cipher: ciphertext,
					api_token_nonce: nonce,
					model,
					last_verified_at: now,
					updated_at: now
				})
				.execute();
		}

		const row = await this.getCredential(userId);
		if (!row) throw new Error('Failed to persist credential');
		return row;
	}

	async getCredential(userId: string): Promise<CredentialRow | null> {
		const row = await this.#db
			.selectFrom('ai_credentials')
			.selectAll()
			.where('user_id', '=', userId)
			.executeTakeFirst();
		return (row as CredentialRow | undefined) ?? null;
	}

	async decryptApiToken(userId: string): Promise<string | null> {
		const row = await this.getCredential(userId);
		if (!row) return null;
		try {
			return decryptToken(row.api_token_cipher, row.api_token_nonce);
		} catch {
			return null;
		}
	}

	async deleteCredential(userId: string): Promise<void> {
		await this.#db.deleteFrom('ai_credentials').where('user_id', '=', userId).execute();
	}
}
