import { Kysely, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2';
import { getServerConfig } from '../env';
import type { DB } from './types';

let dbInstance: Kysely<DB> | null = null;

export function getDb(): Kysely<DB> {
	if (dbInstance) return dbInstance;
	const config = getServerConfig();

	const dialect = new MysqlDialect({
		pool: createPool({
			uri: config.databaseUrl,
			connectionLimit: 10
		})
	});

	dbInstance = new Kysely<DB>({ dialect });
	return dbInstance;
}

export async function closeDb(): Promise<void> {
	if (!dbInstance) return;
	await dbInstance.destroy();
	dbInstance = null;
}
