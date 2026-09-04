import { z } from 'zod';

const emptyString = z
	.string()
	.transform((v) => v ?? '')
	.pipe(z.string());

export const basicsSchema = z.object({
	fullName: emptyString.optional().default(''),
	headline: emptyString.optional().default(''),
	email: emptyString.optional().default(''),
	phone: emptyString.optional().default(''),
	location: emptyString.optional().default(''),
	website: emptyString.optional().default(''),
	summary: emptyString.optional().default('')
});

export const experienceItemSchema = z.object({
	company: emptyString.optional().default(''),
	role: emptyString.optional().default(''),
	start: emptyString.optional().default(''),
	end: emptyString.optional().default(''),
	current: z.boolean().optional().default(false),
	bullets: z.array(z.string()).optional().default([])
});

export const educationItemSchema = z.object({
	institution: emptyString.optional().default(''),
	degree: emptyString.optional().default(''),
	start: emptyString.optional().default(''),
	end: emptyString.optional().default('')
});

export const projectItemSchema = z.object({
	name: emptyString.optional().default(''),
	description: emptyString.optional().default(''),
	link: emptyString.optional().default('')
});

export const resumeDataSchema = z.object({
	basics: basicsSchema.optional().default({
		fullName: '',
		headline: '',
		email: '',
		phone: '',
		location: '',
		website: '',
		summary: ''
	}),
	experience: z.array(experienceItemSchema).optional().default([]),
	education: z.array(educationItemSchema).optional().default([]),
	skills: z.array(z.string()).optional().default([]),
	projects: z.array(projectItemSchema).optional().default([])
});

export type Basics = z.infer<typeof basicsSchema>;
export type ExperienceItem = z.infer<typeof experienceItemSchema>;
export type EducationItem = z.infer<typeof educationItemSchema>;
export type ProjectItem = z.infer<typeof projectItemSchema>;
export type ResumeData = z.infer<typeof resumeDataSchema>;

export function emptyResumeData(): ResumeData {
	return {
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
}

export function parseResumeContent(value: unknown): ResumeData {
	const result = resumeDataSchema.safeParse(value);
	if (result.success) return result.data;
	return emptyResumeData();
}
