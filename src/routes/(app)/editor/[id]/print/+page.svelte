<script lang="ts">
	import { resolve } from '$app/paths';
	import Button from '$lib/components/ui/Button.svelte';
	import ResumePreview from '$lib/components/resume/ResumePreview.svelte';
	import { icons } from '$lib/icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.resume.title} | Print preview</title>
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

	<p class="text-sm text-ink-muted">
		In the print dialog, choose “Save as PDF” to download. Background colors and formatting are
		preserved.
	</p>
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
