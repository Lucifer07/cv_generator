<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Fa from 'svelte-fa';
	import { icons } from '$lib/icons';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let importing = $state(false);
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
		<div class="flex items-center gap-2">
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
			<button
				type="button"
				onclick={() => (importing = true)}
				class="inline-flex h-10 items-center gap-2 rounded-control border border-border px-5 text-sm font-medium transition-colors hover:bg-accent-soft"
			>
				<Fa icon={icons.download} class="h-4 w-4" />
				Import
			</button>
		</div>
	</div>

	{#if importing}
		<form
			method="POST"
			action="?/import"
			enctype="multipart/form-data"
			use:enhance
			class="mt-6 rounded-card border border-border bg-surface p-6"
			onsubmit={() => (importing = false)}
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-sm font-semibold">Import resume</h2>
				<button
					type="button"
					onclick={() => (importing = false)}
					class="inline-flex h-8 w-8 items-center justify-center rounded-control text-ink-muted hover:bg-accent-soft"
					aria-label="Close"
				>
					<Fa icon={icons.dismiss} class="h-4 w-4" />
				</button>
			</div>
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-1.5">
					<label for="import-file" class="text-sm font-medium">File</label>
					<input
						id="import-file"
						name="file"
						type="file"
						accept=".pdf,.docx,.txt"
						required
						class="h-10 rounded-control border border-border bg-surface px-3 text-sm outline-none focus-visible:outline"
					/>
					<p class="text-xs text-ink-muted">PDF, DOCX, or TXT (max 8 MB).</p>
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="import-title" class="text-sm font-medium">Title (optional)</label>
					<input
						id="import-title"
						name="title"
						type="text"
						placeholder="Imported resume"
						class="h-10 rounded-control border border-border bg-surface px-3 text-sm outline-none focus-visible:outline"
					/>
				</div>
				<div class="flex items-center justify-end gap-3">
					<button
						type="button"
						onclick={() => (importing = false)}
						class="inline-flex h-10 items-center rounded-control border border-border px-5 text-sm font-medium transition-colors hover:bg-accent-soft"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="inline-flex h-10 items-center gap-2 rounded-control bg-accent px-5 text-sm font-medium text-surface transition-opacity hover:opacity-90"
					>
						<Fa icon={icons.download} class="h-4 w-4" />
						Import
					</button>
				</div>
			</div>
		</form>
	{/if}

	{#if form?.message}
		<div
			class="mt-4 flex items-start gap-3 rounded-control border border-border bg-surface-alt p-3 text-sm leading-6"
			role="alert"
		>
			<Fa icon={icons.warning} class="mt-0.5 h-4 w-4 shrink-0" />
			<span>{form.message}</span>
		</div>
	{/if}

	{#if data.resumes.length === 0}
		<div
			class="mt-8 flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface-alt px-6 py-16 text-center"
		>
			<Fa icon={icons.dashboard} class="h-6 w-6 text-ink-muted" />
			<p class="mt-4 text-sm font-medium">No resumes yet</p>
			<p class="mt-1 text-sm leading-6 text-ink-muted">
				Start with a blank resume, import an existing one, or use AI to help write it.
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
