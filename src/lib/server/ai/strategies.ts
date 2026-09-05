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
	if (data.basics.fullName) lines.push(`basics.fullName: ${data.basics.fullName}`);
	if (data.basics.headline) lines.push(`basics.headline: ${data.basics.headline}`);
	if (data.basics.email) lines.push(`basics.email: ${data.basics.email}`);
	if (data.basics.phone) lines.push(`basics.phone: ${data.basics.phone}`);
	if (data.basics.location) lines.push(`basics.location: ${data.basics.location}`);
	if (data.basics.website) lines.push(`basics.website: ${data.basics.website}`);
	if (data.basics.summary) lines.push(`basics.summary: ${data.basics.summary}`);
	data.experience.forEach((e, i) => {
		lines.push(
			`experience #${i}: ${e.role || 'Role'} at ${e.company || 'Company'} (${e.start || '?'}–${
				e.current ? 'Present' : e.end || '?'
			})`
		);
		e.bullets.forEach((b, bi) => {
			if (b.trim()) lines.push(`  experience #${i} bullet ${bi}: ${b}`);
		});
	});
	data.education.forEach((ed, i) => {
		lines.push(
			`education #${i}: ${ed.degree || 'Degree'} at ${ed.institution || 'Institution'} (${
				ed.start || '?'
			}–${ed.end || '?'})`
		);
	});
	lines.push(`skills: [${data.skills.join(', ')}]`);
	data.projects.forEach((p, i) => {
		lines.push(`project #${i}: ${p.name || 'Project'}${p.link ? ` (${p.link})` : ''}`);
		if (p.description) lines.push(`  project #${i} description: ${p.description}`);
	});
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
				maxTokens: 1200,
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
				maxTokens: 2000,
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
				maxTokens: 3000,
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
				maxTokens: 2500,
				temperature: 0.3
			};
		}
		case 'chat': {
			if (!custom) throw new Error('A chat message is required.');
			return {
				system:
					"You are a resume editing assistant that can modify the user's resume directly. " +
					'You MUST respond with ONE JSON object and nothing else — no markdown fences, ' +
					'no prose outside the JSON — in exactly this shape:\n' +
					'{ "reply": "<1-3 sentence explanation for the user>", "actions": [ ... ] }\n\n' +
					'Available actions (indices refer to the #N numbers shown in the resume data, 0-based):\n' +
					'- {"op":"set_basics","fields":{"fullName":"..","headline":"..","email":"..","phone":"..","location":"..","website":".."}}\n' +
					'- {"op":"set_summary","value":".."}\n' +
					'- {"op":"add_experience","item":{"company":"..","role":"..","start":"..","end":"..","current":false,"bullets":[".."]}}\n' +
					'- {"op":"update_experience","index":0,"item":{"role":"..","bullets":[".."]}}\n' +
					'- {"op":"remove_experience","index":0}\n' +
					'- {"op":"add_education","item":{"institution":"..","degree":"..","start":"..","end":".."}}\n' +
					'- {"op":"update_education","index":0,"item":{"degree":".."}}\n' +
					'- {"op":"remove_education","index":0}\n' +
					'- {"op":"set_skills","items":[".."]}\n' +
					'- {"op":"add_project","item":{"name":"..","description":"..","link":".."}}\n' +
					'- {"op":"update_project","index":0,"item":{"description":".."}}\n' +
					'- {"op":"remove_project","index":0}\n\n' +
					'Rules:\n' +
					"1. Include ONLY the actions needed to fulfill the user's request.\n" +
					'2. For update_* use a partial item containing only the fields to change.\n' +
					'3. Write polished, ATS-friendly text with strong action verbs and quantified outcomes.\n' +
					'4. For questions or reviews without changes, use "actions": [] and answer in "reply".\n' +
					'5. Dates are plain strings like "2020-01" or "2019".\n' +
					'6. The JSON must be valid: escape quotes and newlines inside strings.\n' +
					"7. STAY IN SCOPE: you only help with the user's resume and career documents. " +
					'If the request is unrelated (general coding, scraping, math, system/database/file ' +
					'access, smalltalk), do NOT answer it — politely decline in "reply" (one sentence, ' +
					'offer resume help instead) and return "actions": []. ' +
					'You have no access to databases, files, terminals, or any external system.',
				user: `Resume data:\n${resumeMd}\n\nUser request:\n${custom}`,
				maxTokens: 3000,
				temperature: 0.2
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
				maxTokens: 8000,
				temperature: 0.1
			};
		}
	}
}
