import { decryptToken } from './crypto';
import { AiProviderAdapter, normalizeChatChunk } from './adapter';
import type { ChatRequest, ChatResponse, CredentialConfig, VerifyResult } from './types';

const CONNECT_TIMEOUT_MS = 30_000;
const TOTAL_TIMEOUT_MS = 120_000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

export class OpenAiCompatAdapter extends AiProviderAdapter {
	async verifyCredentials(cfg: CredentialConfig): Promise<VerifyResult> {
		const token = this.#decryptOrThrow(cfg);
		try {
			const resp = await fetch(`${cfg.endpoint_url}/models`, {
				method: 'GET',
				headers: { Authorization: `Bearer ${token}` },
				signal: AbortSignal.timeout(CONNECT_TIMEOUT_MS)
			});
			if (!resp.ok) return { valid: false };
			const data = (await resp.json().catch(() => null)) as {
				data?: Array<{ id?: string }>;
			} | null;
			const detected = data?.data?.find((m) => typeof m.id === 'string')?.id ?? null;
			return { valid: true, model: detected ?? cfg.model ?? undefined };
		} catch {
			return { valid: false };
		}
	}

	async chat(
		cfg: CredentialConfig,
		req: ChatRequest,
		signal: AbortSignal
	): Promise<ReadableStream<ChatResponse>> {
		const token = this.#decryptOrThrow(cfg);
		const upstream = await fetch(`${cfg.endpoint_url}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				model: req.model,
				messages: req.messages,
				stream: true,
				max_tokens: req.max_tokens,
				temperature: req.temperature,
				stop: req.stop,
				stream_options: { include_usage: true }
			}),
			signal: AbortSignal.any([signal, AbortSignal.timeout(TOTAL_TIMEOUT_MS)])
		});

		if (!upstream.ok || !upstream.body) {
			throw new Error(`Upstream returned ${upstream.status} ${upstream.statusText}`);
		}

		return this.#wrapStream(upstream.body, MAX_RESPONSE_BYTES);
	}

	#decryptOrThrow(cfg: CredentialConfig): string {
		try {
			return decryptToken(cfg.token_cipher, cfg.token_nonce);
		} catch {
			throw new Error('Stored AI token is invalid or unreadable; please re-enter it.');
		}
	}

	#wrapStream(body: ReadableStream<Uint8Array>, maxBytes: number): ReadableStream<ChatResponse> {
		const reader = body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';
		let bytesRead = 0;

		return new ReadableStream<ChatResponse>({
			async pull(controller) {
				try {
					const { done, value } = await reader.read();
					if (done) {
						if (buffer.trim().length > 0) {
							const last = normalizeChatChunk(JSON.parse(buffer));
							if (last) controller.enqueue(last);
						}
						controller.close();
						return;
					}
					bytesRead += value.byteLength;
					if (bytesRead > maxBytes) {
						controller.error(new Error('Upstream response exceeded size cap'));
						await reader.cancel();
						return;
					}
					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split('\n');
					buffer = lines.pop() ?? '';
					for (const line of lines) {
						const trimmed = line.trim();
						if (!trimmed.startsWith('data:')) continue;
						const data = trimmed.slice(5).trim();
						if (data === '[DONE]') {
							controller.close();
							return;
						}
						try {
							const parsed = JSON.parse(data);
							const normalized = normalizeChatChunk(parsed);
							if (normalized) controller.enqueue(normalized);
						} catch {
							// ignore malformed chunk
						}
					}
				} catch (err) {
					controller.error(err);
				}
			},
			async cancel() {
				await reader.cancel();
			}
		});
	}
}
