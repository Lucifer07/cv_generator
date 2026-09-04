<script lang="ts">
	import { resolve } from '$app/paths';
	import Fa from 'svelte-fa';
	import { icons } from '$lib/icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.resume.title} | CV Generator</title>
</svelte:head>

<div class="mx-auto w-full max-w-6xl px-6 py-12">
	<a
		href={resolve('/dashboard')}
		class="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink"
	>
		Back to dashboard
	</a>

	<div class="mt-4 flex items-end justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">{data.resume.title}</h1>
			<p class="mt-2 text-sm leading-6 text-ink-muted">
				Editor and live preview are implemented in milestone M3.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<button
				type="button"
				disabled
				class="inline-flex h-10 items-center gap-2 rounded-control border border-border px-4 text-sm font-medium opacity-50"
			>
				<Fa icon={icons.download} class="h-4 w-4" />
				Export PDF
			</button>
		</div>
	</div>

	<div
		class="mt-8 flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface-alt px-6 py-16 text-center"
	>
		<Fa icon={icons.edit} class="h-6 w-6 text-ink-muted" />
		<p class="mt-4 text-sm font-medium">Editor placeholder</p>
		<p class="mt-1 max-w-sm text-sm leading-6 text-ink-muted">
			Resume data is loaded and persisted; the form-based editor will be added in milestone M3.
		</p>
	</div>
</div>
