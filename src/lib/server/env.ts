import { env } from '$env/dynamic/private';

export interface ServerConfig {
	databaseUrl: string;
	sessionSecret: string;
	aiTokenEncKey: string;
	rateLimitRpm: number;
}

function readRequired(name: string): string {
	const value = env[name];
	if (!value) {
		throw new Error(
			`Missing required environment variable: ${name}. Copy .env.example to .env and fill in the values.`
		);
	}
	return value;
}

let cached: ServerConfig | null = null;

export function getServerConfig(): ServerConfig {
	if (cached) return cached;

	const databaseUrl = readRequired('DATABASE_URL');
	const sessionSecret = readRequired('SESSION_SECRET');
	const aiTokenEncKey = readRequired('AI_TOKEN_ENC_KEY');
	const rateLimitRpm = Number.parseInt(env['AI_PROXY_RATE_LIMIT_RPM'] ?? '30', 10);

	if (Number.isNaN(rateLimitRpm) || rateLimitRpm <= 0) {
		throw new Error('AI_PROXY_RATE_LIMIT_RPM must be a positive integer');
	}

	cached = { databaseUrl, sessionSecret, aiTokenEncKey, rateLimitRpm };
	return cached;
}
