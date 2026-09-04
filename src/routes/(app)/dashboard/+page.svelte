<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Fa from 'svelte-fa';
	import { icons } from '$lib/icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Dashboard | CV Generator</title>
</svelte:head>

<div class="mx-auto w-full max-w-6xl px-6 py-12">
	<div class="flex items-end justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Your resumes</h1>
			<p class="mt-2 text-sm leading-6 text-ink-muted">Create, edit, and export your resumes.</p>
		</div>
		<form method="POST" action="?/create" use:enhance>
			<input type="hidden" name="title" value="Untitled resume" />
			<button
				type="submit"
				class="inline-flex h-10 items-center gap-2 rounded-control bg-accent px-5 text-sm font-medium text-surface transition-opacity hover:opacity-90"
			>
				<Fa icon={icons.create} class="h-4 w-4" />
				New resume
			</button>
		</form>
	</div>

	{#if data.resumes.length === 0}
		<div
			class="mt-8 flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface-alt px-6 py-16 text-center"
		>
			<Fa icon={icons.dashboard} class="h-6 w-6 text-ink-muted" />
			<p class="mt-4 text-sm font-medium">No resumes yet</p>
			<p class="mt-1 text-sm leading-6 text-ink-muted">
				Start with a blank resume. AI-assisted writing is available once your credentials are
				configured.
			</p>
		</div>
	{:else}
		<ul class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.resumes as resume (resume.id)}
				<li class="rounded-card border border-border bg-surface p-5">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<p class="truncate text-sm font-medium">{resume.title}</p>
							<p class="mt-1 text-xs text-ink-muted">
								Updated {new Date(resume.updated_at).toLocaleString()}
							</p>
						</div>
					</div>
					<div class="mt-4 flex items-center gap-2">
						<a
							href={resolve(`/editor/${resume.id}`)}
							class="inline-flex h-9 items-center gap-2 rounded-control border border-border px-3 text-sm font-medium transition-colors hover:bg-accent-soft"
						>
							<Fa icon={icons.edit} class="h-3.5 w-3.5" />
							Edit
						</a>
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="id" value={resume.id} />
							<button
								type="submit"
								class="inline-flex h-9 items-center rounded-control border border-border px-3 text-sm font-medium transition-colors hover:bg-accent-soft"
							>
								Delete
							</button>
						</form>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
