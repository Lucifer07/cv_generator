<script lang="ts">
	import Fa from 'svelte-fa';
	import TextField from '$lib/components/ui/TextField.svelte';
	import DateField from '$lib/components/ui/DateField.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import { icons } from '$lib/icons';
	import type { ResumeDocument } from '$lib/stores/resumeDocument.svelte';

	interface Props {
		doc: ResumeDocument;
	}
	let { doc }: Props = $props();
</script>

<div class="flex flex-col gap-5">
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-semibold">Education</h3>
		<Button icon={icons.create} variant="secondary" onclick={() => doc.addEducation()}>
			Add school
		</Button>
	</div>

	{#if doc.education.length === 0}
		<p class="text-sm text-ink-muted">No education entries yet.</p>
	{/if}

	{#each doc.education as item, index (index)}
		<div class="rounded-card border border-border p-4">
			<div class="flex items-start justify-between gap-3">
				<p class="text-xs font-medium text-ink-muted">Entry {index + 1}</p>
				<ConfirmDialog
					title="Remove education entry?"
					description={`"${item.degree || item.institution || 'Entry ' + (index + 1)}" will be removed from your CV.`}
					onConfirm={() => doc.removeEducation(index)}
				>
					{#snippet children(open)}
						<button
							type="button"
							aria-label="Remove education entry"
							onclick={() => open()}
							class="inline-flex h-7 w-7 items-center justify-center rounded-control text-danger transition-colors hover:bg-danger-soft"
						>
							<Fa icon={icons.trash} class="h-3.5 w-3.5" />
						</button>
					{/snippet}
				</ConfirmDialog>
			</div>

			<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
				<TextField
					id={`edu-${index}-institution`}
					label="Institution"
					value={item.institution}
					oninput={(v) => doc.updateEducation(index, { institution: v })}
				/>
				<TextField
					id={`edu-${index}-degree`}
					label="Degree"
					value={item.degree}
					oninput={(v) => doc.updateEducation(index, { degree: v })}
				/>
				<DateField
					id={`edu-${index}-start`}
					label="Start"
					value={item.start}
					onchange={(v) => doc.updateEducation(index, { start: v })}
				/>
				<DateField
					id={`edu-${index}-end`}
					label="End"
					value={item.end}
					onchange={(v) => doc.updateEducation(index, { end: v })}
				/>
			</div>
		</div>
	{/each}
</div>
