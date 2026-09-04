import { z } from 'zod';

export const credentialConfigSchema = z.object({
	endpoint_url: z.string().url(),
	token: z.string().min(1),
	model: z.string().optional()
});

export type CredentialConfigInput = z.infer<typeof credentialConfigSchema>;

export const chatRequestSchema = z.object({
	messages: z
		.array(
			z.object({
				role: z.enum(['system', 'user', 'assistant']),
				content: z.string()
			})
		)
		.min(1),
	model: z.string().optional(),
	max_tokens: z.number().int().positive().max(4096).optional(),
	temperature: z.number().min(0).max(2).optional()
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
