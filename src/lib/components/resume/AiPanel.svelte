<script lang="ts">
	import Fa from 'svelte-fa';
	import Button from '$lib/components/ui/Button.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';
	import { icons } from '$lib/icons';
	import type { ResumeData } from '$lib/schemas/resume';

	type Strategy = 'summary' | 'rewrite' | 'tailor' | 'review';

	interface Props {
		strategy: Strategy;
		data: ResumeData;
		context?: { selectedBullets?: string[]; jobDescription?: string };
		onApply: (suggestion: string) => void;
		disabled?: boolean;
		model?: string | null;
	}

	let { strategy, data, context = {}, onApply, disabled = false, model = null }: Props = $props();

	let suggestion = $state<string>('');
	let streaming = $state(false);
	let error = $state<string | null>(null);

	// eslint-disable-next-line svelte/prefer-writable-derived
	let modelOverride = $state<string>(model ?? '');

	async function run() {
		if (streaming) return;
		streaming = true;
		error = null;
		suggestion = '';

		const body = {
			strategy,
			resume: data,
			context,
			model: modelOverride || undefined
		};

		try {
			const resp = await fetch('/api/ai/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!resp.ok || !resp.body) {
				const err = await resp.json().catch(() => ({ error: 'Request failed' }));
				throw new Error(err.error ?? `Upstream ${resp.status}`);
			}

			const reader = resp.body.getReader();
			const decoder = new TextDecoder();
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				suggestion += decoder.decode(value, { stream: true });
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			streaming = false;
		}
	}

	const labels: Record<Strategy, string> = {
		summary: 'Generate summary',
		rewrite: 'Rewrite selected bullets',
		tailor: 'Tailor to job description',
		review: 'Review resume'
	};
</script>

<div class="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
	<div class="flex items-center justify-between">
		<h4 class="flex items-center gap-2 text-sm font-semibold">
			<Fa icon={icons.ai} class="h-4 w-4" /> AI: {labels[strategy]}
		</h4>
		<Button
			variant="ghost"
			size="sm"
			onclick={() => (suggestion = '')}
			disabled={!suggestion && !streaming}
		>
			Clear
		</Button>
	</div>

	<TextField
		id={`ai-model-${strategy}`}
		label="Model (optional override)"
		value={modelOverride}
		oninput={(v) => (modelOverride = v)}
		hint="Leave empty to use default from settings"
	/>

	<Button
		variant="primary"
		icon={icons.ai}
		loading={streaming}
		onclick={run}
		disabled={streaming || disabled}
	>
		{streaming ? 'Streaming…' : 'Generate'}
	</Button>

	{#if error}
		<div class="text-xs text-red-600">{error}</div>
	{/if}

	{#if suggestion}
		<div class="flex flex-col gap-2">
			<label for={`ai-suggestion-${strategy}`} class="text-xs text-ink-muted">
				Suggestion (editable)
			</label>
			<textarea
				id={`ai-suggestion-${strategy}`}
				class="min-h-24 rounded-control border border-border bg-surface px-3 py-2 text-sm leading-6 outline-none focus-visible:outline"
				value={suggestion}
				oninput={(e) => (suggestion = (e.target as HTMLTextAreaElement).value)}></textarea>
			<div class="flex items-center justify-end gap-2">
				<Button
					variant="secondary"
					onclick={() => {
						navigator.clipboard.writeText(suggestion);
					}}
				>
					Copy
				</Button>
				<Button variant="primary" onclick={() => onApply(suggestion)} disabled={!suggestion}>
					Apply
				</Button>
			</div>
		</div>
	{/if}
</div>
