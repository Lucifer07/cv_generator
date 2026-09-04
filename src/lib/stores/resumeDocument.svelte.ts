import type {
	Basics,
	EducationItem,
	ExperienceItem,
	ProjectItem,
	ResumeData
} from '$lib/schemas/resume';
import { emptyResumeData, parseResumeContent } from '$lib/schemas/resume';

export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export interface ResumeDocumentOptions {
	id: string;
	title: string;
	initial: ResumeData;
	autosaveMs?: number;
	onSave: (next: ResumeData) => Promise<void>;
}

export class ResumeDocument {
	id: string;
	#title: string = $state('');
	#basics: Basics = $state(emptyResumeData().basics);
	#experience: ExperienceItem[] = $state([]);
	#education: EducationItem[] = $state([]);
	#skills: string[] = $state([]);
	#projects: ProjectItem[] = $state([]);
	#saveState: SaveState = $state('idle');
	#lastSavedAt: number | null = $state(null);
	#errorMessage: string | null = $state(null);

	readonly #onSave: (next: ResumeData) => Promise<void>;
	readonly #autosaveMs: number;
	#debounceTimer: ReturnType<typeof setTimeout> | null = null;
	#inflight: Promise<void> | null = null;

	constructor(opts: ResumeDocumentOptions) {
		this.id = opts.id;
		this.#title = opts.title;
		this.#onSave = opts.onSave;
		this.#autosaveMs = opts.autosaveMs ?? 800;
		this.#hydrate(opts.initial);
	}

	#hydrate(value: ResumeData) {
		const data = parseResumeContent(value);
		this.#basics = { ...data.basics };
		this.#experience = data.experience.map((e) => ({ ...e, bullets: [...e.bullets] }));
		this.#education = data.education.map((e) => ({ ...e }));
		this.#skills = [...data.skills];
		this.#projects = data.projects.map((p) => ({ ...p }));
	}

	get title(): string {
		return this.#title;
	}
	set title(value: string) {
		if (this.#title === value) return;
		this.#title = value;
		this.#markDirty();
	}

	get basics(): Basics {
		return this.#basics;
	}
	get experience(): ExperienceItem[] {
		return this.#experience;
	}
	get education(): EducationItem[] {
		return this.#education;
	}
	get skills(): string[] {
		return this.#skills;
	}
	get projects(): ProjectItem[] {
		return this.#projects;
	}
	get saveState(): SaveState {
		return this.#saveState;
	}
	get lastSavedAt(): number | null {
		return this.#lastSavedAt;
	}
	get errorMessage(): string | null {
		return this.#errorMessage;
	}

	get data(): ResumeData {
		return {
			basics: { ...this.#basics },
			experience: this.#experience.map((e) => ({ ...e, bullets: [...e.bullets] })),
			education: this.#education.map((e) => ({ ...e })),
			skills: [...this.#skills],
			projects: this.#projects.map((p) => ({ ...p }))
		};
	}

	updateBasics<K extends keyof Basics>(key: K, value: Basics[K]) {
		this.#basics = { ...this.#basics, [key]: value };
		this.#markDirty();
	}

	addExperience() {
		this.#experience = [
			...this.#experience,
			{ company: '', role: '', start: '', end: '', current: false, bullets: [] }
		];
		this.#markDirty();
	}

	removeExperience(index: number) {
		this.#experience = this.#experience.filter((_, i) => i !== index);
		this.#markDirty();
	}

	updateExperience(index: number, patch: Partial<ExperienceItem>) {
		this.#experience = this.#experience.map((item, i) =>
			i === index ? { ...item, ...patch } : item
		);
		this.#markDirty();
	}

	addBullet(index: number) {
		this.#experience = this.#experience.map((item, i) =>
			i === index ? { ...item, bullets: [...item.bullets, ''] } : item
		);
		this.#markDirty();
	}

	updateBullet(expIndex: number, bulletIndex: number, value: string) {
		this.#experience = this.#experience.map((item, i) => {
			if (i !== expIndex) return item;
			const bullets = item.bullets.map((b, bi) => (bi === bulletIndex ? value : b));
			return { ...item, bullets };
		});
		this.#markDirty();
	}

	removeBullet(expIndex: number, bulletIndex: number) {
		this.#experience = this.#experience.map((item, i) => {
			if (i !== expIndex) return item;
			return { ...item, bullets: item.bullets.filter((_, bi) => bi !== bulletIndex) };
		});
		this.#markDirty();
	}

	addEducation() {
		this.#education = [...this.#education, { institution: '', degree: '', start: '', end: '' }];
		this.#markDirty();
	}

	removeEducation(index: number) {
		this.#education = this.#education.filter((_, i) => i !== index);
		this.#markDirty();
	}

	updateEducation(index: number, patch: Partial<EducationItem>) {
		this.#education = this.#education.map((item, i) =>
			i === index ? { ...item, ...patch } : item
		);
		this.#markDirty();
	}

	addProject() {
		this.#projects = [...this.#projects, { name: '', description: '', link: '' }];
		this.#markDirty();
	}

	removeProject(index: number) {
		this.#projects = this.#projects.filter((_, i) => i !== index);
		this.#markDirty();
	}

	updateProject(index: number, patch: Partial<ProjectItem>) {
		this.#projects = this.#projects.map((item, i) => (i === index ? { ...item, ...patch } : item));
		this.#markDirty();
	}

	setSkills(value: string) {
		const list = value
			.split(',')
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
		this.#skills = list;
		this.#markDirty();
	}

	#markDirty() {
		this.#saveState = 'dirty';
		this.#errorMessage = null;
		if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
		this.#debounceTimer = setTimeout(() => {
			void this.save();
		}, this.#autosaveMs);
	}

	async save(): Promise<void> {
		if (this.#inflight) {
			await this.#inflight;
		}
		const run = async (): Promise<void> => {
			this.#saveState = 'saving';
			try {
				await this.#onSave(this.data);
				this.#saveState = 'saved';
				this.#lastSavedAt = Date.now();
				this.#errorMessage = null;
			} catch (err) {
				this.#saveState = 'error';
				this.#errorMessage = err instanceof Error ? err.message : 'Save failed';
			}
		};
		this.#inflight = run();
		try {
			await this.#inflight;
		} finally {
			this.#inflight = null;
		}
	}

	destroy() {
		if (this.#debounceTimer) {
			clearTimeout(this.#debounceTimer);
			this.#debounceTimer = null;
		}
	}
}
