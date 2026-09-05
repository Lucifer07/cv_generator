<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { fly } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import Fa from 'svelte-fa';
	import BasicsSection from '$lib/components/resume/BasicsSection.svelte';
	import ExperienceSection from '$lib/components/resume/ExperienceSection.svelte';
	import EducationSection from '$lib/components/resume/EducationSection.svelte';
	import ProjectsSection from '$lib/components/resume/ProjectsSection.svelte';
	import SkillsSection from '$lib/components/resume/SkillsSection.svelte';
	import ResumePreview from '$lib/components/resume/ResumePreview.svelte';
	import AiChatAssistant from '$lib/components/resume/AiChatAssistant.svelte';
	import { ResumeDocument } from '$lib/stores/resumeDocument.svelte';
	import { icons } from '$lib/icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Section = 'basics' | 'experience' | 'education' | 'skills' | 'projects';
	let activeSection: Section = $state('basics');

	const initial = untrack(() => ({
		id: data.resume.id,
		title: data.resume.title,
		initial: data.resume.content
	}));

	const doc = new ResumeDocument({
		id: initial.id,
		title: initial.title,
		initial: initial.initial,
		autosaveMs: 800,
		onSave: async (next) => {
			const resp = await fetch('?/save', {
				method: 'POST',
				headers: { 'x-sveltekit-action': 'true' },
				body: new URLSearchParams({
					content: JSON.stringify(next),
					title: untrack(() => doc.title)
				})
			});
			if (!resp.ok) throw new Error('Save failed');
		}
	});

	onDestroy(() => doc.destroy());

	const sections: Array<{ id: Section; label: string; icon: typeof icons.edit }> = [
		{ id: 'basics', label: 'Basics', icon: icons.edit },
		{ id: 'experience', label: 'Experience', icon: icons.dashboard },
		{ id: 'education', label: 'Education', icon: icons.key },
		{ id: 'skills', label: 'Skills', icon: icons.ai },
		{ id: 'projects', label: 'Projects', icon: icons.create }
	];

	const saveStateLabel: Record<typeof doc.saveState, string> = {
		idle: 'Ready',
		dirty: 'Editing…',
		saving: 'Saving…',
		saved: 'Saved',
		error: 'Save failed'
	};

	const hasCredentials = untrack(
		() => (data as { hasCredentials?: boolean }).hasCredentials ?? true
	);
	const defaultModel = untrack(
		() => (data as { defaultModel?: string | null }).defaultModel ?? null
	);

	async function applyStrategy(
		strategy: 'summary' | 'rewrite' | 'tailor' | 'review' | 'chat',
		context?: Record<string, unknown>
	): Promise<string> {
		const resp = await fetch('/api/ai/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				strategy,
				resume: doc.data,
				context,
				model: defaultModel
			})
		});
		if (!resp.ok) throw new Error('AI request failed');
		return resp.text();
	}

	function applyEdits(actions: import('$lib/schemas/ai').EditAction[]): number {
		let applied = 0;
		for (const action of actions) {
			if (doc.applyEdit(action)) applied += 1;
		}
		return applied;
	}
</script>

<svelte:head>
	<title>{doc.title} | CV Generator</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
	<div class="flex animate-fade-in-up items-end justify-between gap-4">
		<div class="min-w-0">
			<a href={resolve('/dashboard')} class="text-sm text-ink-muted hover:text-ink">
				Back to dashboard
			</a>
			<input
				type="text"
				value={doc.title}
				oninput={(e) => (doc.title = (e.target as HTMLInputElement).value)}
				aria-label="Resume title"
				class="mt-2 w-full bg-transparent text-2xl font-semibold tracking-tight outline-none"
			/>
		</div>
		<div class="flex items-center gap-3">
			<span class="text-xs text-ink-muted" aria-live="polite">
				{saveStateLabel[doc.saveState]}
				{#if doc.saveState === 'saved' && doc.lastSavedAt}
					· {new Date(doc.lastSavedAt).toLocaleTimeString()}
				{/if}
			</span>
			<button
				type="button"
				onclick={() => doc.save()}
				disabled={doc.saveState === 'saving' ||
					(doc.saveState !== 'dirty' && doc.saveState !== 'error')}
				class="inline-flex h-10 items-center gap-2 rounded-control border border-border px-4 text-sm font-medium transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
			>
				<Fa icon={icons.success} class="h-4 w-4" />
				Save
			</button>
			<a
				href={resolve(`/editor/${data.resume.id}/print`)}
				class="inline-flex h-10 items-center gap-2 rounded-control border border-border px-4 text-sm font-medium transition-colors hover:bg-accent-soft"
			>
				<Fa icon={icons.download} class="h-4 w-4" />
				Export PDF
			</a>
		</div>
	</div>

	{#if doc.saveState === 'error' && doc.errorMessage}
		<div
			class="flex animate-fade-in items-start gap-3 rounded-control border border-border bg-surface-alt p-3 text-sm leading-6"
			role="alert"
		>
			<Fa icon={icons.warning} class="mt-0.5 h-4 w-4 shrink-0" />
			<span>{doc.errorMessage}</span>
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr_1fr]">
		<aside class="lg:sticky lg:top-6 lg:self-start">
			<nav class="flex flex-col gap-1" aria-label="Resume sections">
				{#each sections as section (section.id)}
					<button
						type="button"
						class="inline-flex h-10 items-center gap-2 rounded-control px-3 text-left text-sm font-medium transition-all {activeSection ===
						section.id
							? 'bg-accent text-surface shadow-card'
							: 'hover:bg-accent-soft'}"
						aria-current={activeSection === section.id ? 'true' : undefined}
						onclick={() => (activeSection = section.id)}
					>
						<Fa icon={section.icon} class="h-4 w-4" />
						{section.label}
					</button>
				{/each}
			</nav>
		</aside>

		<div class="flex flex-col gap-4">
			<section class="rounded-card border border-border bg-surface p-6 shadow-card">
				{#key activeSection}
					<div in:fly={{ y: 12, duration: 250, easing: (t) => 1 - Math.pow(1 - t, 3) }}>
						{#if activeSection === 'basics'}
							<BasicsSection {doc} />
						{:else if activeSection === 'experience'}
							<ExperienceSection {doc} />
						{:else if activeSection === 'education'}
							<EducationSection {doc} />
						{:else if activeSection === 'skills'}
							<SkillsSection {doc} />
						{:else if activeSection === 'projects'}
							<ProjectsSection {doc} />
						{/if}
					</div>
				{/key}
			</section>

			{#if !hasCredentials}
				<div
					class="rounded-card border border-dashed border-border bg-surface-alt p-6 text-sm leading-6"
				>
					<p class="flex items-center gap-2 font-medium">
						<Fa icon={icons.warning} class="h-4 w-4" /> AI features are disabled
					</p>
					<p class="mt-1 text-ink-muted">
						Add an AI endpoint and token in
						<a href={resolve('/settings')} class="font-medium underline underline-offset-4"
							>Settings</a
						>.
					</p>
				</div>
			{/if}
		</div>

		<div class="lg:sticky lg:top-6 lg:self-start">
			<ResumePreview data={doc.data} />
		</div>
	</div>

	{#if hasCredentials}
		<AiChatAssistant onApplyStrategy={applyStrategy} onApplyEdits={applyEdits} />
	{/if}
</div>
