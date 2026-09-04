<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Fa from 'svelte-fa';
	import { icons } from '$lib/icons';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Sign up | CV Generator</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center px-6">
	<div class="w-full max-w-sm">
		<h1 class="text-2xl font-semibold tracking-tight">Sign up</h1>
		<p class="mt-2 text-sm leading-6 text-ink-muted">
			Create an account and connect your own AI credentials.
		</p>

		{#if form?.message}
			<div
				class="mt-6 flex items-start gap-3 rounded-control border border-border bg-surface-alt p-4 text-sm leading-6"
			>
				<Fa
					icon={form?.message?.includes('created') ? icons.success : icons.warning}
					class="mt-0.5 h-4 w-4 shrink-0"
				/>
				<span>{form.message}</span>
			</div>
		{/if}

		<form method="POST" use:enhance class="mt-6 flex flex-col gap-4" aria-label="Sign up form">
			<div class="flex flex-col gap-1.5">
				<label for="email" class="text-sm font-medium">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					value={form?.email ?? ''}
					class="h-10 rounded-control border border-border bg-surface px-3 text-sm outline-none focus-visible:outline"
				/>
			</div>

			<div class="flex flex-col gap-1.5">
				<label for="password" class="text-sm font-medium">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="new-password"
					minlength="8"
					required
					class="h-10 rounded-control border border-border bg-surface px-3 text-sm outline-none focus-visible:outline"
				/>
			</div>

			<button
				type="submit"
				class="mt-2 inline-flex h-10 items-center justify-center rounded-control bg-accent px-5 text-sm font-medium text-surface transition-opacity hover:opacity-90"
			>
				Sign up
			</button>
		</form>

		<p class="mt-6 text-sm text-ink-muted">
			Already have an account?
			<a href={resolve('/login')} class="font-medium text-ink underline underline-offset-4">
				Log in
			</a>
		</p>
	</div>
</main>
