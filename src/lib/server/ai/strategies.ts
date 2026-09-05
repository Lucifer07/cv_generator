import type { ResumeData } from '$lib/schemas/resume';

export type AiStrategy = 'summary' | 'rewrite' | 'tailor' | 'review' | 'chat' | 'import';

export interface StrategyRequest {
	strategy: AiStrategy;
	resume: ResumeData;
	context?: {
		targetRole?: string;
		jobDescription?: string;
		selectedBullets?: string[];
		customPrompt?: string;
	};
}

const SYSTEM_BASE =
	'You are an expert resume writer and career coach. Be specific, actionable, and concise. ' +
	'Output ONLY the requested content as plain text, no markdown, no preamble. ' +
	'Use strong action verbs and quantified outcomes where possible.';

function dataToMarkdown(data: ResumeData): string {
	const lines: string[] = [];
	if (data.basics.fullName) lines.push(`Name: ${data.basics.fullName}`);
	if (data.basics.headline) lines.push(`Headline: ${data.basics.headline}`);
	if (data.basics.email) lines.push(`Email: ${data.basics.email}`);
	if (data.basics.summary) lines.push(`Summary: ${data.basics.summary}`);
	for (const e of data.experience) {
		if (!e.company && !e.role) continue;
		lines.push(
			`Experience: ${e.role || 'Role'} at ${e.company || 'Company'} (${e.start || '?'}–${
				e.current ? 'Present' : e.end || '?'
			})`
		);
		for (const b of e.bullets) {
			if (b.trim()) lines.push(`  - ${b}`);
		}
	}
	for (const ed of data.education) {
		if (!ed.institution && !ed.degree) continue;
		lines.push(
			`Education: ${ed.degree || 'Degree'} at ${ed.institution || 'Institution'} (${
				ed.start || '?'
			}–${ed.end || '?'})`
		);
	}
	if (data.skills.length > 0) lines.push(`Skills: ${data.skills.join(', ')}`);
	for (const p of data.projects) {
		if (!p.name) continue;
		lines.push(`Project: ${p.name}${p.link ? ` (${p.link})` : ''}`);
		if (p.description) lines.push(`  ${p.description}`);
	}
	return lines.join('\n');
}

export function buildPrompt(req: StrategyRequest): {
	system: string;
	user: string;
	maxTokens: number;
	temperature: number;
} {
	const resumeMd = dataToMarkdown(req.resume);
	const custom = req.context?.customPrompt?.trim();

	switch (req.strategy) {
		case 'summary': {
			return {
				system: SYSTEM_BASE,
				user:
					'Write a 3–4 sentence professional summary for this candidate. ' +
					'Tone: confident, specific, no clichés. Resume data:\n' +
					resumeMd,
				maxTokens: 220,
				temperature: 0.5
			};
		}
		case 'rewrite': {
			const bullets = (req.context?.selectedBullets ?? []).filter((b) => b.trim());
			const block =
				bullets.length > 0
					? bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')
					: 'No bullets provided — improve the most recent experience role.';
			return {
				system: SYSTEM_BASE,
				user:
					'Rewrite each numbered bullet to be stronger, more specific, and outcome-oriented. ' +
					'Output one bullet per line, preserving the order. Do not number them. Bullets:\n' +
					block,
				maxTokens: 420,
				temperature: 0.4
			};
		}
		case 'tailor': {
			const jd = req.context?.jobDescription?.trim();
			const role = req.context?.targetRole?.trim();
			if (!jd && !role) {
				throw new Error('A job description or target role is required to tailor the resume.');
			}
			return {
				system: SYSTEM_BASE,
				user:
					`Suggest specific edits to tailor this resume` +
					`${role ? ` for the role "${role}"` : ''}. Output a numbered list of concrete ` +
					'suggestions. After the list, a one-line summary of the most important change.\n' +
					'Resume:\n' +
					resumeMd +
					(jd ? `\n\nJob description:\n${jd}` : ''),
				maxTokens: 700,
				temperature: 0.4
			};
		}
		case 'review': {
			const focus = custom ? `\n\nFocus on this specific request from the user:\n${custom}` : '';
			return {
				system: SYSTEM_BASE,
				user:
					'Review this resume and list 5–8 specific improvements as numbered items. ' +
					'Focus on impact, clarity, and ATS-friendliness. Resume:\n' +
					resumeMd +
					focus,
				maxTokens: 500,
				temperature: 0.3
			};
		}
		case 'chat': {
			if (!custom) throw new Error('A chat message is required.');
			return {
				system:
					SYSTEM_BASE +
					'\n\nYou are helping edit a resume. Use the resume data as context. ' +
					'If the user asks to change something, propose the exact new text and explain briefly.',
				user: `Resume data:\n${resumeMd}\n\nUser request:\n${custom}`,
				maxTokens: 800,
				temperature: 0.4
			};
		}
		case 'import': {
			if (!custom) throw new Error('Raw resume text is required.');
			return {
				system:
					'You are a resume parsing engine. Convert the resume text below into JSON that ' +
					'exactly matches this TypeScript type:\n' +
					'{\n' +
					'  basics: { fullName, headline, email, phone, location, website, summary },\n' +
					'  experience: [{ company, role, start, end, current, bullets: string[] }],\n' +
					'  education: [{ institution, degree, start, end }],\n' +
					'  skills: string[],\n' +
					'  projects: [{ name, description, link }]\n' +
					'}\n' +
					'Rules: dates as plain strings (e.g. "2019-01" or "2019"); set current=true when ' +
					'the role is ongoing; put achievement lines under bullets; write a 2-3 sentence ' +
					'objective summary only if the text implies one, otherwise empty string. ' +
					'Output ONLY the JSON object. No markdown fences, no commentary.',
				user: 'Resume text:\n' + custom.slice(0, 12_000),
				maxTokens: 1600,
				temperature: 0.1
			};
		}
	}
}
