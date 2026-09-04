<script lang="ts">
	import type { ResumeData } from '$lib/schemas/resume';

	interface Props {
		data: ResumeData;
	}
	let { data }: Props = $props();

	function formatDateRange(start: string, end: string, current: boolean): string {
		const startStr = start || '—';
		if (current) return `${startStr} — Present`;
		return `${startStr} — ${end || '—'}`;
	}
</script>

<article
	class="rounded-card border border-border bg-white p-8 text-sm leading-6 text-ink shadow-sm print:border-0 print:shadow-none"
>
	<header class="border-b border-border pb-4">
		<h1 class="text-2xl font-semibold tracking-tight">
			{data.basics.fullName || 'Your Name'}
		</h1>
		{#if data.basics.headline}
			<p class="mt-1 text-sm text-ink-muted">{data.basics.headline}</p>
		{/if}
		<ul class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-muted">
			{#if data.basics.email}<li>{data.basics.email}</li>{/if}
			{#if data.basics.phone}<li>{data.basics.phone}</li>{/if}
			{#if data.basics.location}<li>{data.basics.location}</li>{/if}
			{#if data.basics.website}<li>{data.basics.website}</li>{/if}
		</ul>
	</header>

	{#if data.basics.summary}
		<section class="mt-5">
			<h2 class="text-xs font-semibold tracking-widest text-ink-muted uppercase">Summary</h2>
			<p class="mt-1 whitespace-pre-line">{data.basics.summary}</p>
		</section>
	{/if}

	{#if data.experience.length > 0}
		<section class="mt-5">
			<h2 class="text-xs font-semibold tracking-widest text-ink-muted uppercase">Experience</h2>
			<ul class="mt-2 flex flex-col gap-4">
				{#each data.experience as item, i (i)}
					<li>
						<div class="flex items-baseline justify-between gap-3">
							<p class="font-medium">{item.role || 'Role'}</p>
							<p class="text-xs text-ink-muted">
								{formatDateRange(item.start, item.end, item.current)}
							</p>
						</div>
						<p class="text-xs text-ink-muted">{item.company || 'Company'}</p>
						{#if item.bullets.length > 0}
							<ul class="mt-1 list-disc space-y-1 pl-5">
								{#each item.bullets as bullet, bi (bi)}
									{#if bullet.trim()}
										<li class="text-sm leading-6">{bullet}</li>
									{/if}
								{/each}
							</ul>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if data.education.length > 0}
		<section class="mt-5">
			<h2 class="text-xs font-semibold tracking-widest text-ink-muted uppercase">Education</h2>
			<ul class="mt-2 flex flex-col gap-3">
				{#each data.education as item, i (i)}
					<li>
						<div class="flex items-baseline justify-between gap-3">
							<p class="font-medium">{item.degree || 'Degree'}</p>
							<p class="text-xs text-ink-muted">{formatDateRange(item.start, item.end, false)}</p>
						</div>
						<p class="text-xs text-ink-muted">{item.institution || 'Institution'}</p>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if data.skills.length > 0}
		<section class="mt-5">
			<h2 class="text-xs font-semibold tracking-widest text-ink-muted uppercase">Skills</h2>
			<p class="mt-1">{data.skills.join(' · ')}</p>
		</section>
	{/if}

	{#if data.projects.length > 0}
		<section class="mt-5">
			<h2 class="text-xs font-semibold tracking-widest text-ink-muted uppercase">Projects</h2>
			<ul class="mt-2 flex flex-col gap-3">
				{#each data.projects as item, i (i)}
					<li>
						<div class="flex items-baseline justify-between gap-3">
							<p class="font-medium">{item.name || 'Project'}</p>
							{#if item.link}
								<p class="text-xs text-ink-muted">{item.link}</p>
							{/if}
						</div>
						{#if item.description}
							<p class="mt-1 text-sm leading-6">{item.description}</p>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</article>
