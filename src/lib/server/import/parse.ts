import type { ResumeData } from '$lib/schemas/resume';

/**
 * Best-effort parser that turns raw extracted text (from PDF/DOCX) into a
 * structured ResumeData. It is deliberately tolerant: unmatched content is
 * folded into the summary. Users then refine fields in the editor.
 */
export function textToResumeData(raw: string): ResumeData {
	const lines = raw
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter(Boolean);

	const data: ResumeData = {
		basics: {
			fullName: '',
			headline: '',
			email: '',
			phone: '',
			location: '',
			website: '',
			summary: ''
		},
		experience: [],
		education: [],
		skills: [],
		projects: []
	};

	const emailMatch = raw.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
	if (emailMatch) data.basics.email = emailMatch[0];

	const phoneMatch = raw.match(/(\+?[\d\s().-]{8,})/);
	if (phoneMatch) data.basics.phone = phoneMatch[1].trim();

	const urlMatch = raw.match(/https?:\/\/[^\s]+/);
	if (urlMatch) data.basics.website = urlMatch[0];

	if (lines.length > 0) data.basics.fullName = lines[0];

	// Heuristic: gather lines after a "SKILLS" header as comma-separated
	const skillHeaderIdx = lines.findIndex((l) => /^skills?$/i.test(l));
	if (skillHeaderIdx !== -1) {
		let cursor = skillHeaderIdx + 1;
		const skillChunks: string[] = [];
		while (cursor < lines.length && !isSectionHeader(lines[cursor])) {
			for (const part of lines[cursor].split(/[,•|]/)) {
				const trimmed = part.trim();
				if (trimmed) skillChunks.push(trimmed);
			}
			cursor += 1;
		}
		data.skills = skillChunks;
	}

	// Everything else is folded into the summary
	const reserved = new Set([data.basics.fullName, data.basics.email, ...data.skills]);
	data.basics.summary = lines
		.filter((l) => !reserved.has(l) && !isSectionHeader(l))
		.slice(0, 12)
		.join(' ');

	return data;
}

function isSectionHeader(line: string): boolean {
	return /^(summary|experience|education|skills|projects?|contact|education|profile|work\b)/i.test(
		line
	);
}
