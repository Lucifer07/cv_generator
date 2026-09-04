import type { Insertable, Kysely } from 'kysely';
import type { DB } from '../db/types';

export interface ResumeRow {
	id: string;
	user_id: string;
	title: string;
	content: unknown;
	created_at: string;
	updated_at: string;
}

export class ResumeRepository {
	readonly #db: Kysely<DB>;

	constructor(db: Kysely<DB>) {
		this.#db = db;
	}

	async create(userId: string, title: string, content: unknown): Promise<ResumeRow> {
		const now = new Date().toISOString();
		const row = await this.#db
			.insertInto('resumes')
			.values({
				user_id: userId,
				title,
				content,
				created_at: now,
				updated_at: now
			} as Insertable<DB['resumes']>)
			.returningAll()
			.executeTakeFirstOrThrow();
		return row as ResumeRow;
	}

	async findAllByUser(userId: string): Promise<ResumeRow[]> {
		const rows = await this.#db
			.selectFrom('resumes')
			.selectAll()
			.where('user_id', '=', userId)
			.orderBy('updated_at', 'desc')
			.execute();
		return rows as ResumeRow[];
	}

	async findByIdAndUser(resumeId: string, userId: string): Promise<ResumeRow | null> {
		const row = await this.#db
			.selectFrom('resumes')
			.selectAll()
			.where('id', '=', resumeId)
			.where('user_id', '=', userId)
			.executeTakeFirst();
		return (row as ResumeRow | undefined) ?? null;
	}

	async updateContent(resumeId: string, userId: string, content: unknown): Promise<ResumeRow> {
		const row = await this.#db
			.updateTable('resumes')
			.set({ content, updated_at: new Date().toISOString() })
			.where('id', '=', resumeId)
			.where('user_id', '=', userId)
			.returningAll()
			.executeTakeFirstOrThrow();
		return row as ResumeRow;
	}

	async updateTitle(resumeId: string, userId: string, title: string): Promise<ResumeRow> {
		const row = await this.#db
			.updateTable('resumes')
			.set({ title, updated_at: new Date().toISOString() })
			.where('id', '=', resumeId)
			.where('user_id', '=', userId)
			.returningAll()
			.executeTakeFirstOrThrow();
		return row as ResumeRow;
	}

	async delete(resumeId: string, userId: string): Promise<void> {
		await this.#db
			.deleteFrom('resumes')
			.where('id', '=', resumeId)
			.where('user_id', '=', userId)
			.execute();
	}
}
