<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Fa from 'svelte-fa';
	import { icons } from '$lib/icons';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Log in | CV Generator</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center px-6">
	<div class="w-full max-w-sm animate-fade-in-up">
		<h1 class="text-2xl font-semibold tracking-tight">Log in</h1>
		<p class="mt-2 text-sm leading-6 text-ink-muted">Access your resumes and AI settings.</p>

		{#if form?.message}
			<div
				class="mt-6 flex animate-fade-in items-start gap-3 rounded-control border border-border bg-surface-alt p-4 text-sm leading-6"
			>
				<Fa icon={icons.warning} class="mt-0.5 h-4 w-4 shrink-0" />
				<span>{form.message}</span>
			</div>
		{/if}

		<form
			method="POST"
			use:enhance
			class="mt-6 flex flex-col gap-4"
			aria-label="Log in form"
			style="animation-delay: 100ms"
		>
			<div class="flex flex-col gap-1.5">
				<label for="email" class="text-sm font-medium">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					value={form?.email ?? ''}
					class="h-10 rounded-control border border-border bg-surface px-3 text-sm transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:outline"
				/>
			</div>

			<div class="flex flex-col gap-1.5">
				<label for="password" class="text-sm font-medium">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
					class="h-10 rounded-control border border-border bg-surface px-3 text-sm transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:outline"
				/>
			</div>

			<button
				type="submit"
				class="mt-2 inline-flex h-10 items-center justify-center rounded-control bg-accent px-5 text-sm font-medium text-surface shadow-card transition-all hover:opacity-90 hover:shadow-float active:scale-[0.98]"
			>
				Log in
			</button>
		</form>

		<p class="mt-6 text-sm text-ink-muted">
			No account yet?
			<a href={resolve('/register')} class="font-medium text-ink underline underline-offset-4">
				Sign up
			</a>
		</p>
	</div>
</main>
