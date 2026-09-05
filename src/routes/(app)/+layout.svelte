<script lang="ts">
	import { resolve } from '$app/paths';
	import Fa from 'svelte-fa';
	import type { Snippet } from 'svelte';
	import { icons } from '$lib/icons';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<header
		class="sticky top-0 z-40 border-b border-border/60 bg-surface/80 backdrop-blur-md print:hidden"
	>
		<div class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
			<a href={resolve('/dashboard')} class="text-sm font-semibold tracking-tight">CV Generator</a>
			<nav class="flex items-center gap-3" aria-label="Application">
				<span class="hidden text-sm text-ink-muted sm:inline">{data.email}</span>
				<a
					href={resolve('/settings')}
					class="inline-flex h-9 items-center gap-2 rounded-control px-3 text-sm font-medium transition-colors hover:bg-accent-soft"
					aria-label="Settings"
				>
					<Fa icon={icons.settings} class="h-4 w-4" />
					<span class="hidden sm:inline">Settings</span>
				</a>
				<form method="POST" action="/logout">
					<button
						type="submit"
						class="inline-flex h-9 items-center rounded-control border border-border px-3 text-sm font-medium transition-colors hover:bg-accent-soft"
					>
						Log out
					</button>
				</form>
			</nav>
		</div>
	</header>

	{#if data.settingsRequired}
		<div class="animate-fade-in border-b border-border bg-accent-soft print:hidden">
			<div
				class="mx-auto flex w-full max-w-6xl items-start gap-3 px-6 py-3 text-sm leading-6"
				role="status"
			>
				<Fa icon={icons.warning} class="mt-0.5 h-4 w-4 shrink-0" />
				<span>
					AI features are disabled until you configure an endpoint and token.
					<a href={resolve('/settings')} class="font-medium underline underline-offset-4"
						>Open settings</a
					>.
				</span>
			</div>
		</div>
	{/if}

	<main class="flex-1 animate-fade-in-up">
		{@render children()}
	</main>
</div>
