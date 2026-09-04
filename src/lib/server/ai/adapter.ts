import type { ChatRequest, ChatResponse, CredentialConfig, VerifyResult } from './types';

export abstract class AiProviderAdapter {
	abstract verifyCredentials(cfg: CredentialConfig): Promise<VerifyResult>;
	abstract chat(
		cfg: CredentialConfig,
		req: ChatRequest,
		signal: AbortSignal
	): Promise<ReadableStream<ChatResponse>>;
}

export function normalizeChatChunk(parsed: unknown): ChatResponse | null {
	if (typeof parsed !== 'object' || parsed === null) return null;
	const obj = parsed as Record<string, unknown>;
	if (typeof obj['id'] !== 'string') return null;
	if (typeof obj['object'] !== 'string') return null;
	if (typeof obj['created'] !== 'number') return null;
	if (typeof obj['model'] !== 'string') return null;
	if (!Array.isArray(obj['choices'])) return null;
	return obj as unknown as ChatResponse;
}
