<script lang="ts">
	import Fa from 'svelte-fa';
	import { icons } from '$lib/icons';
	import { resolve } from '$app/paths';
	import Reveal from '$lib/components/ui/Reveal.svelte';
</script>

<svelte:head>
	<title>CV Generator</title>
	<meta
		name="description"
		content="Build professional resumes with AI-assisted content, using your own AI credentials."
	/>
</svelte:head>

<div class="flex min-h-screen flex-col">
	<header class="sticky top-0 z-40 border-b border-border/60 bg-surface/80 backdrop-blur-md">
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
					class="inline-flex h-9 items-center rounded-control bg-accent px-4 text-sm font-medium text-surface transition-all hover:opacity-90 active:scale-[0.98]"
				>
					Sign up
				</a>
			</nav>
		</div>
	</header>

	<main class="flex-1">
		<section class="relative overflow-hidden">
			<div aria-hidden="true" class="pointer-events-none absolute inset-0">
				<div
					class="absolute -top-40 left-1/2 h-[520px] w-[760px] -translate-x-1/2 animate-float-slow rounded-full bg-gradient-to-r from-ink/5 via-ink/10 to-ink/5 blur-3xl"
				></div>
				<div
					class="absolute top-48 -left-28 h-72 w-72 animate-float rounded-full bg-ink/5 blur-3xl"
				></div>
				<div
					class="absolute top-72 -right-28 h-80 w-80 animate-float-slow rounded-full bg-ink/5 blur-3xl"
				></div>
			</div>

			<div class="relative mx-auto w-full max-w-6xl px-6 pt-24 pb-16 text-center sm:pt-32">
				<div class="animate-fade-in-up">
					<span
						class="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-ink-muted backdrop-blur"
					>
						<span class="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-ink"></span>
						AI-assisted resume builder
					</span>
				</div>
				<h1
					class="mx-auto mt-6 max-w-2xl animate-fade-in-up text-4xl font-semibold tracking-tight sm:text-5xl"
					style="animation-delay: 100ms"
				>
					Resumes that get interviews
				</h1>
				<p
					class="mx-auto mt-5 max-w-xl animate-fade-in-up text-base leading-7 text-ink-muted"
					style="animation-delay: 200ms"
				>
					Build a clean, ATS-friendly resume with AI-assisted writing. Connect your own AI endpoint
					and token, and keep full control of your data.
				</p>
				<div
					class="mt-8 flex animate-fade-in-up items-center justify-center gap-3"
					style="animation-delay: 300ms"
				>
					<a
						href={resolve('/register')}
						class="inline-flex h-10 items-center gap-2 rounded-control bg-accent px-5 text-sm font-medium text-surface shadow-card transition-all hover:opacity-90 hover:shadow-float active:scale-[0.98]"
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
			</div>

			<div
				class="relative mx-auto w-full max-w-6xl animate-fade-in-up px-6 pb-24"
				style="animation-delay: 400ms"
			>
				<div
					class="mx-auto max-w-2xl rounded-card border border-border bg-surface p-8 shadow-float"
				>
					<div class="flex items-center gap-2 border-b border-border pb-4">
						<span class="h-2.5 w-2.5 rounded-full bg-ink/10"></span>
						<span class="h-2.5 w-2.5 rounded-full bg-ink/10"></span>
						<span class="h-2.5 w-2.5 rounded-full bg-ink/10"></span>
						<span class="ml-2 h-2 w-24 rounded-full bg-ink/10"></span>
					</div>
					<div class="mt-5 flex items-center justify-between">
						<div>
							<div class="h-3 w-40 rounded-full bg-ink/15"></div>
							<div class="mt-2 h-2 w-28 rounded-full bg-ink/10"></div>
						</div>
						<div class="h-2 w-20 rounded-full bg-ink/10"></div>
					</div>
					<div class="mt-6 flex items-center gap-2">
						<div class="h-2 w-16 rounded-full bg-ink/20"></div>
						<div class="h-2 w-2 rounded-full bg-ink/10"></div>
						<div class="h-2 w-24 rounded-full bg-ink/10"></div>
					</div>
					<div class="mt-4 space-y-2">
						<div class="h-2 w-full rounded-full bg-ink/10"></div>
						<div class="h-2 w-5/6 rounded-full bg-ink/10"></div>
						<div class="h-2 w-4/6 rounded-full bg-ink/10"></div>
					</div>
					<div class="mt-6 flex items-center gap-2">
						<div class="h-2 w-20 rounded-full bg-ink/20"></div>
						<div class="h-2 w-2 rounded-full bg-ink/10"></div>
						<div class="h-2 w-32 rounded-full bg-ink/10"></div>
					</div>
					<div class="mt-4 space-y-2">
						<div class="h-2 w-full rounded-full bg-ink/10"></div>
						<div class="h-2 w-3/4 rounded-full bg-ink/10"></div>
					</div>
				</div>
			</div>
		</section>

		<section class="border-t border-border bg-surface-alt">
			<div class="mx-auto grid w-full max-w-6xl gap-6 px-6 py-16 sm:grid-cols-3">
				<Reveal>
					<div
						class="group rounded-card border border-border bg-surface p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
					>
						<div
							class="inline-flex h-10 w-10 items-center justify-center rounded-control bg-accent-soft transition-colors duration-300 group-hover:bg-accent group-hover:text-surface"
						>
							<Fa icon={icons.ai} class="h-5 w-5" />
						</div>
						<h2 class="mt-4 text-sm font-semibold">AI-assisted writing</h2>
						<p class="mt-2 text-sm leading-6 text-ink-muted">
							Generate summaries, rewrite bullet points, and tailor content to a job description.
						</p>
					</div>
				</Reveal>
				<Reveal delay={100}>
					<div
						class="group rounded-card border border-border bg-surface p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
					>
						<div
							class="inline-flex h-10 w-10 items-center justify-center rounded-control bg-accent-soft transition-colors duration-300 group-hover:bg-accent group-hover:text-surface"
						>
							<Fa icon={icons.key} class="h-5 w-5" />
						</div>
						<h2 class="mt-4 text-sm font-semibold">Your own credentials</h2>
						<p class="mt-2 text-sm leading-6 text-ink-muted">
							Every account connects a personal AI endpoint and token. Keys are encrypted and never
							leave the server.
						</p>
					</div>
				</Reveal>
				<Reveal delay={200}>
					<div
						class="group rounded-card border border-border bg-surface p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
					>
						<div
							class="inline-flex h-10 w-10 items-center justify-center rounded-control bg-accent-soft transition-colors duration-300 group-hover:bg-accent group-hover:text-surface"
						>
							<Fa icon={icons.download} class="h-5 w-5" />
						</div>
						<h2 class="mt-4 text-sm font-semibold">Export to PDF</h2>
						<p class="mt-2 text-sm leading-6 text-ink-muted">
							Download a selectable-text, ATS-parsable PDF that matches the live preview.
						</p>
					</div>
				</Reveal>
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
