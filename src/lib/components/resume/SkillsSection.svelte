<script lang="ts">
	import type { ResumeDocument } from '$lib/stores/resumeDocument.svelte';

	interface Props {
		doc: ResumeDocument;
	}
	let { doc }: Props = $props();

	function handle(event: Event) {
		const target = event.target as HTMLInputElement;
		doc.setSkills(target.value);
	}
</script>

<div class="flex flex-col gap-2">
	<label for="skills" class="text-sm font-medium">Skills</label>
	<input
		id="skills"
		type="text"
		value={doc.skills.join(', ')}
		oninput={handle}
		placeholder="TypeScript, Svelte, PostgreSQL, …"
		class="h-10 rounded-control border border-border bg-surface px-3 text-sm outline-none focus-visible:outline"
	/>
	<p class="text-xs text-ink-muted">Separate skills with commas.</p>
</div>
