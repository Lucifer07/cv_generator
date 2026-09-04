export interface CredentialConfig {
	user_id: string;
	endpoint_url: string;
	token_cipher: string;
	token_nonce: string;
	model?: string | null;
	aad?: Buffer | null;
}

export interface VerifyResult {
	valid: boolean;
	model?: string;
}

export interface ChatRequest {
	messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
	model?: string;
	max_tokens?: number;
	temperature?: number;
	stop?: string[];
}

export interface ChatResponse {
	id: string;
	object: string;
	created: number;
	model: string;
	choices: Array<{
		index: number;
		delta?: { role?: string; content?: string };
		message?: { role: string; content: string | null };
		finish_reason: string | null;
	}>;
	usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}
