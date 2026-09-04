import type { ColumnType } from 'kysely';

export interface UsersTable {
	id: string;
	email: string;
	password_hash: string;
	created_at: ColumnType<string, string | undefined, string | undefined>;
}

export interface AiCredentialsTable {
	user_id: string;
	endpoint_url: string;
	api_token_cipher: string;
	api_token_nonce: string;
	model: string | null;
	last_verified_at: ColumnType<string | null, string | null | undefined, string | null | undefined>;
	updated_at: ColumnType<string, string | undefined, string | undefined>;
}

export interface ResumesTable {
	id: ColumnType<string, string | undefined, string | undefined>;
	user_id: string;
	title: string;
	content: unknown;
	created_at: ColumnType<string, string | undefined, string | undefined>;
	updated_at: ColumnType<string, string | undefined, string | undefined>;
}

export interface DB {
	users: UsersTable;
	ai_credentials: AiCredentialsTable;
	resumes: ResumesTable;
}
