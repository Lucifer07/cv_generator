import type { ResumeData } from '$lib/schemas/resume';

export type AiStrategy = 'summary' | 'rewrite' | 'tailor' | 'review';

export interface StrategyRequest {
	strategy: AiStrategy;
	resume: ResumeData;
	context?: { targetRole?: string; jobDescription?: string; selectedBullets?: string[] };
}

const SYSTEM_BASE =
	'You are an expert resume writer. Output ONLY the requested content as plain text, ' +
	'no markdown, no preamble, no commentary. Use strong action verbs, quantified outcomes ' +
	'where possible, and one bullet per line when listing items.';

function dataToMarkdown(data: ResumeData): string {
	const lines: string[] = [];
	if (data.basics.fullName) lines.push(`Name: ${data.basics.fullName}`);
	if (data.basics.headline) lines.push(`Headline: ${data.basics.headline}`);
	if (data.basics.summary) lines.push(`Summary: ${data.basics.summary}`);
	for (const e of data.experience) {
		if (!e.company && !e.role) continue;
		lines.push(
			`Experience: ${e.role || 'Role'} at ${e.company || 'Company'} (${e.start || '?'}–${e.current ? 'Present' : e.end || '?'})`
		);
		for (const b of e.bullets) {
			if (b.trim()) lines.push(`  - ${b}`);
		}
	}
	for (const ed of data.education) {
		if (!ed.institution && !ed.degree) continue;
		lines.push(
			`Education: ${ed.degree || 'Degree'} at ${ed.institution || 'Institution'} (${ed.start || '?'}–${ed.end || '?'})`
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
	switch (req.strategy) {
		case 'summary': {
			return {
				system: SYSTEM_BASE,
				user:
					'Write a 3–4 sentence professional summary for this candidate. ' +
					'Tone: confident, specific, no clichés. ' +
					'Resume data:\n' +
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
					'Output one bullet per line, preserving the order. Do not number them. ' +
					'Bullets to rewrite:\n' +
					block,
				maxTokens: 320,
				temperature: 0.4
			};
		}
		case 'tailor': {
			const jd = req.context?.jobDescription?.trim();
			const role = req.context?.targetRole?.trim();
			if (!jd) {
				throw new Error('A job description is required to tailor the resume.');
			}
			return {
				system: SYSTEM_BASE,
				user:
					`Suggest specific edits to tailor this resume for the target role` +
					`${role ? ` "${role}"` : ''}. Output a numbered list of concrete suggestions: ` +
					'either a bullet rewrite or a one-line note. After the list, output a one-line ' +
					'summary of the most important change. Resume:\n' +
					resumeMd +
					'\n\nJob description:\n' +
					jd,
				maxTokens: 600,
				temperature: 0.4
			};
		}
		case 'review': {
			return {
				system: SYSTEM_BASE,
				user:
					'Review this resume and list 5–8 specific improvements as numbered items. ' +
					'Focus on impact, clarity, and ATS-friendliness. Resume:\n' +
					resumeMd,
				maxTokens: 400,
				temperature: 0.3
			};
		}
	}
}
