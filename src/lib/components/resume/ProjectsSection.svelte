<script lang="ts">
	import Fa from 'svelte-fa';
	import TextField from '$lib/components/ui/TextField.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { icons } from '$lib/icons';
	import type { ResumeDocument } from '$lib/stores/resumeDocument.svelte';

	interface Props {
		doc: ResumeDocument;
	}
	let { doc }: Props = $props();
</script>

<div class="flex flex-col gap-5">
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-semibold">Projects</h3>
		<Button icon={icons.create} variant="secondary" onclick={() => doc.addProject()}>
			Add project
		</Button>
	</div>

	{#if doc.projects.length === 0}
		<p class="text-sm text-ink-muted">
			No projects yet. Highlight side projects and open-source work.
		</p>
	{/if}

	{#each doc.projects as item, index (index)}
		<div class="rounded-card border border-border p-4">
			<div class="flex items-start justify-between gap-3">
				<p class="text-xs font-medium text-ink-muted">Project {index + 1}</p>
				<button
					type="button"
					aria-label="Remove project"
					onclick={() => doc.removeProject(index)}
					class="inline-flex h-7 w-7 items-center justify-center rounded-control text-ink-muted hover:bg-accent-soft"
				>
					<Fa icon={icons.dismiss} class="h-3.5 w-3.5" />
				</button>
			</div>

			<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
				<TextField
					id={`proj-${index}-name`}
					label="Name"
					value={item.name}
					oninput={(v) => doc.updateProject(index, { name: v })}
				/>
				<TextField
					id={`proj-${index}-link`}
					label="Link"
					type="url"
					placeholder="https://"
					value={item.link}
					oninput={(v) => doc.updateProject(index, { link: v })}
				/>
			</div>

			<div class="mt-3">
				<TextField
					id={`proj-${index}-description`}
					label="Description"
					value={item.description}
					multiline
					rows={3}
					oninput={(v) => doc.updateProject(index, { description: v })}
				/>
			</div>
		</div>
	{/each}
</div>
