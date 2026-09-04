import { getDb } from '../db';
import { CredentialRepository } from '../repositories/credential.repository';
import { OpenAiCompatAdapter } from './openai-compat';
import type { ChatRequest, ChatResponse, CredentialConfig, VerifyResult } from './types';
import { getServerConfig } from '../env';

const adapter = new OpenAiCompatAdapter();

export interface LoadedCredential extends CredentialConfig {
	user_id: string;
}

export async function loadCredential(userId: string): Promise<LoadedCredential | null> {
	const row = await new CredentialRepository(getDb()).getCredential(userId);
	if (!row) return null;
	return {
		user_id: userId,
		endpoint_url: row.endpoint_url,
		token_cipher: row.api_token_cipher,
		token_nonce: row.api_token_nonce,
		model: row.model
	};
}

export async function verifyUserCredential(userId: string): Promise<VerifyResult> {
	const cfg = await loadCredential(userId);
	if (!cfg) return { valid: false };
	return adapter.verifyCredentials(cfg);
}

export async function streamChat(
	userId: string,
	req: ChatRequest,
	signal: AbortSignal
): Promise<ReadableStream<ChatResponse>> {
	const cfg = await loadCredential(userId);
	if (!cfg) throw new Error('AI credentials are not configured.');
	return adapter.chat(cfg, req, signal);
}

export function getAiRateLimitRpm(): number {
	return getServerConfig().rateLimitRpm;
}
