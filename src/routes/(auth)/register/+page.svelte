<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Sign up | CV Generator</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center px-6">
	<div class="w-full max-w-sm">
		<h1 class="text-2xl font-semibold tracking-tight">Sign up</h1>
		<p class="mt-2 text-sm leading-6 text-ink-muted">
			Registration is implemented in milestone M1.
		</p>
		<a
			href={resolve('/')}
			class="mt-6 inline-flex h-10 items-center rounded-control border border-border px-5 text-sm font-medium transition-colors hover:bg-accent-soft"
		>
			Back to home
		</a>
	</div>
</main>
