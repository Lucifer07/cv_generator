<script lang="ts">
	import type { Snippet } from 'svelte';
	import Fa from 'svelte-fa';
	import { icons } from '$lib/icons';

	interface Props {
		title: string;
		description?: string;
		confirmLabel?: string;
		children: Snippet<[() => void]>;
		onConfirm: () => void;
	}

	let { title, description = '', confirmLabel = 'Delete', children, onConfirm }: Props = $props();

	let open = $state(false);

	function handleConfirm() {
		onConfirm();
		open = false;
	}
</script>

{@render children(() => (open = true))}

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-label={title}
	>
		<button
			type="button"
			aria-label="Cancel"
			onclick={() => (open = false)}
			class="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-sm"
		></button>
		<div
			class="relative w-full max-w-sm animate-scale-in rounded-card border border-border bg-surface p-6 shadow-float"
		>
			<div class="flex items-start gap-3">
				<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger-soft">
					<Fa icon={icons.trash} class="h-4 w-4 text-danger" />
				</div>
				<div>
					<h3 class="text-sm font-semibold">{title}</h3>
					{#if description}
						<p class="mt-1 text-sm leading-6 text-ink-muted">{description}</p>
					{/if}
				</div>
			</div>
			<div class="mt-6 flex items-center justify-end gap-3">
				<button
					type="button"
					onclick={() => (open = false)}
					class="inline-flex h-9 items-center rounded-control border border-border px-4 text-sm font-medium transition-colors hover:bg-accent-soft"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleConfirm}
					class="inline-flex h-9 items-center gap-2 rounded-control bg-danger px-4 text-sm font-medium text-surface transition-all hover:opacity-90 active:scale-[0.98]"
				>
					<Fa icon={icons.trash} class="h-3.5 w-3.5" />
					{confirmLabel}
				</button>
			</div>
		</div>
	</div>
{/if}
