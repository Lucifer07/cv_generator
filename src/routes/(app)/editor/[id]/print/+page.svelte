<script lang="ts">
	import { resolve } from '$app/paths';
	import Fa from 'svelte-fa';
	import Button from '$lib/components/ui/Button.svelte';
	import ResumePreview from '$lib/components/resume/ResumePreview.svelte';
	import { icons } from '$lib/icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.resume.title}</title>
</svelte:head>

<div class="print-screen-hidden mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
	<div class="flex items-center justify-between">
		<a href={resolve(`/editor/${data.resume.id}`)} class="text-sm text-ink-muted hover:text-ink">
			Back to editor
		</a>
		<Button icon={icons.download} variant="primary" onclick={() => window.print()}>
			Print / save as PDF
		</Button>
	</div>

	<div
		class="flex items-start gap-3 rounded-control border border-border bg-surface-alt p-4 text-sm leading-6"
	>
		<Fa icon={icons.warning} class="mt-0.5 h-4 w-4 shrink-0" />
		<p>
			In the print dialog, choose <strong>“Save as PDF”</strong> and
			<strong>uncheck “Headers and footers”</strong> to remove the page title, URL, and page numbers.
			Background colors and formatting are preserved.
		</p>
	</div>
</div>

<div class="print-only">
	<ResumePreview data={data.resume.content} />
</div>

<style>
	.print-only {
		display: none;
	}
	.print-screen-hidden {
		display: flex;
	}
	@media print {
		@page {
			size: A4;
			margin: 12mm;
		}
		.print-screen-hidden {
			display: none !important;
		}
		.print-only {
			display: block !important;
		}
	}
</style>
