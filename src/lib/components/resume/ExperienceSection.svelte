<script lang="ts">
	import Fa from 'svelte-fa';
	import TextField from '$lib/components/ui/TextField.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { icons } from '$lib/icons';
	import { toDateInputValue } from '$lib/utils/dates';
	import type { ResumeDocument } from '$lib/stores/resumeDocument.svelte';

	interface Props {
		doc: ResumeDocument;
	}
	let { doc }: Props = $props();
</script>

<div class="flex flex-col gap-5">
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-semibold">Experience</h3>
		<Button icon={icons.create} variant="secondary" onclick={() => doc.addExperience()}>
			Add role
		</Button>
	</div>

	{#if doc.experience.length === 0}
		<p class="text-sm text-ink-muted">No work experience yet. Add your first role.</p>
	{/if}

	{#each doc.experience as item, index (index)}
		<div class="rounded-card border border-border p-4">
			<div class="flex items-start justify-between gap-3">
				<p class="text-xs font-medium text-ink-muted">Role {index + 1}</p>
				<button
					type="button"
					aria-label="Remove role"
					onclick={() => doc.removeExperience(index)}
					class="inline-flex h-7 w-7 items-center justify-center rounded-control text-ink-muted hover:bg-accent-soft"
				>
					<Fa icon={icons.dismiss} class="h-3.5 w-3.5" />
				</button>
			</div>

			<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
				<TextField
					id={`exp-${index}-company`}
					label="Company"
					value={item.company}
					oninput={(v) => doc.updateExperience(index, { company: v })}
				/>
				<TextField
					id={`exp-${index}-role`}
					label="Role"
					value={item.role}
					oninput={(v) => doc.updateExperience(index, { role: v })}
				/>
				<TextField
					id={`exp-${index}-start`}
					label="Start"
					type="date"
					value={toDateInputValue(item.start)}
					oninput={(v) => doc.updateExperience(index, { start: v })}
				/>
				<TextField
					id={`exp-${index}-end`}
					label="End"
					type="date"
					value={toDateInputValue(item.end)}
					disabled={item.current}
					oninput={(v) => doc.updateExperience(index, { end: v })}
				/>
			</div>

			<label class="mt-3 flex items-center gap-2 text-sm">
				<input
					type="checkbox"
					checked={item.current}
					onchange={(e) =>
						doc.updateExperience(index, { current: (e.target as HTMLInputElement).checked })}
					class="h-4 w-4 rounded border border-border"
				/>
				I currently work here
			</label>

			<div class="mt-4 flex flex-col gap-2">
				<p class="text-sm font-medium">Highlights</p>
				{#each item.bullets as bullet, bi (bi)}
					<div class="flex items-start gap-2">
						<TextField
							id={`exp-${index}-bullet-${bi}`}
							label=""
							value={bullet}
							multiline
							rows={2}
							oninput={(v) => doc.updateBullet(index, bi, v)}
						/>
						<button
							type="button"
							aria-label="Remove bullet"
							onclick={() => doc.removeBullet(index, bi)}
							class="mt-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-accent-soft"
						>
							<Fa icon={icons.dismiss} class="h-3.5 w-3.5" />
						</button>
					</div>
				{/each}
				<Button variant="ghost" icon={icons.create} onclick={() => doc.addBullet(index)}>
					Add highlight
				</Button>
			</div>
		</div>
	{/each}
</div>
