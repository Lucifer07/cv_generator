<script lang="ts">
	import Fa from 'svelte-fa';
	import { icons } from '$lib/icons';
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>CV Generator</title>
	<meta
		name="description"
		content="Build professional resumes with AI-assisted content, using your own AI credentials."
	/>
</svelte:head>

<div class="flex min-h-screen flex-col">
	<header class="border-b border-border">
		<div class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
			<a href={resolve('/')} class="text-sm font-semibold tracking-tight">CV Generator</a>
			<nav class="flex items-center gap-3" aria-label="Main">
				<a
					href={resolve('/login')}
					class="inline-flex h-9 items-center rounded-control px-4 text-sm font-medium text-ink transition-colors hover:bg-accent-soft"
				>
					Log in
				</a>
				<a
					href={resolve('/register')}
					class="inline-flex h-9 items-center rounded-control bg-accent px-4 text-sm font-medium text-surface transition-opacity hover:opacity-90"
				>
					Sign up
				</a>
			</nav>
		</div>
	</header>

	<main class="flex-1">
		<section class="mx-auto w-full max-w-6xl px-6 py-24 text-center">
			<h1 class="mx-auto max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
				Resumes that get interviews
			</h1>
			<p class="mx-auto mt-5 max-w-xl text-base leading-7 text-ink-muted">
				Build a clean, ATS-friendly resume with AI-assisted writing. Connect your own AI endpoint
				and token, and keep full control of your data.
			</p>
			<div class="mt-8 flex items-center justify-center gap-3">
				<a
					href={resolve('/register')}
					class="inline-flex h-10 items-center gap-2 rounded-control bg-accent px-5 text-sm font-medium text-surface transition-opacity hover:opacity-90"
				>
					<Fa icon={icons.create} class="h-4 w-4" />
					Create your resume
				</a>
				<a
					href={resolve('/login')}
					class="inline-flex h-10 items-center rounded-control border border-border px-5 text-sm font-medium transition-colors hover:bg-accent-soft"
				>
					Log in
				</a>
			</div>
		</section>

		<section class="border-t border-border bg-surface-alt">
			<div class="mx-auto grid w-full max-w-6xl gap-6 px-6 py-16 sm:grid-cols-3">
				<div class="rounded-card border border-border bg-surface p-6">
					<Fa icon={icons.ai} class="h-5 w-5 text-ink" />
					<h2 class="mt-4 text-sm font-semibold">AI-assisted writing</h2>
					<p class="mt-2 text-sm leading-6 text-ink-muted">
						Generate summaries, rewrite bullet points, and tailor content to a job description.
					</p>
				</div>
				<div class="rounded-card border border-border bg-surface p-6">
					<Fa icon={icons.key} class="h-5 w-5 text-ink" />
					<h2 class="mt-4 text-sm font-semibold">Your own credentials</h2>
					<p class="mt-2 text-sm leading-6 text-ink-muted">
						Every account connects a personal AI endpoint and token. Keys are encrypted and never
						leave the server.
					</p>
				</div>
				<div class="rounded-card border border-border bg-surface p-6">
					<Fa icon={icons.download} class="h-5 w-5 text-ink" />
					<h2 class="mt-4 text-sm font-semibold">Export to PDF</h2>
					<p class="mt-2 text-sm leading-6 text-ink-muted">
						Download a selectable-text, ATS-parsable PDF that matches the live preview.
					</p>
				</div>
			</div>
		</section>
	</main>

	<footer class="border-t border-border">
		<div
			class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 text-sm text-ink-muted"
		>
			<span>CV Generator</span>
			<span>Build professional resumes with AI assistance</span>
		</div>
	</footer>
</div>
