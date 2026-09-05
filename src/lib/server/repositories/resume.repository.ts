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

function toJson(value: unknown): string {
	return JSON.stringify(value ?? null);
}

function fromJson<T>(value: unknown): T {
	if (value === null || value === undefined) return value as T;
	if (typeof value === 'string') {
		try {
			return JSON.parse(value) as T;
		} catch {
			return value as T;
		}
	}
	return value as T;
}

export class ResumeRepository {
	readonly #db: Kysely<DB>;

	constructor(db: Kysely<DB>) {
		this.#db = db;
	}

	async create(userId: string, title: string, content: unknown): Promise<ResumeRow> {
		const row: ResumeRow = {
			id: crypto.randomUUID(),
			user_id: userId,
			title,
			content,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		};
		await this.#db
			.insertInto('resumes')
			.values({ ...row, content: toJson(content) } as Insertable<DB['resumes']>)
			.execute();
		return row;
	}

	async findAllByUser(userId: string): Promise<ResumeRow[]> {
		const rows = await this.#db
			.selectFrom('resumes')
			.selectAll()
			.where('user_id', '=', userId)
			.orderBy('updated_at', 'desc')
			.execute();
		return rows.map((r) => ({ ...(r as ResumeRow), content: fromJson(r.content) }));
	}

	async findByIdAndUser(resumeId: string, userId: string): Promise<ResumeRow | null> {
		const row = await this.#db
			.selectFrom('resumes')
			.selectAll()
			.where('id', '=', resumeId)
			.where('user_id', '=', userId)
			.executeTakeFirst();
		if (!row) return null;
		return { ...(row as ResumeRow), content: fromJson(row.content) };
	}

	async updateContent(resumeId: string, userId: string, content: unknown): Promise<ResumeRow> {
		const updatedAt = new Date().toISOString();
		await this.#db
			.updateTable('resumes')
			.set({ content: toJson(content), updated_at: updatedAt })
			.where('id', '=', resumeId)
			.where('user_id', '=', userId)
			.execute();
		const row = await this.findByIdAndUser(resumeId, userId);
		if (!row) throw new Error('Resume not found after update');
		return row;
	}

	async updateTitle(resumeId: string, userId: string, title: string): Promise<ResumeRow> {
		const updatedAt = new Date().toISOString();
		await this.#db
			.updateTable('resumes')
			.set({ title, updated_at: updatedAt })
			.where('id', '=', resumeId)
			.where('user_id', '=', userId)
			.execute();
		const row = await this.findByIdAndUser(resumeId, userId);
		if (!row) throw new Error('Resume not found after update');
		return row;
	}

	async delete(resumeId: string, userId: string): Promise<void> {
		await this.#db
			.deleteFrom('resumes')
			.where('id', '=', resumeId)
			.where('user_id', '=', userId)
			.execute();
	}
}
