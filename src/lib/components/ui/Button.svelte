<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

	interface Props {
		variant?: Variant;
		type?: 'button' | 'submit' | 'reset';
		icon?: IconDefinition;
		iconRight?: IconDefinition;
		disabled?: boolean;
		loading?: boolean;
		formaction?: string;
		formmethod?: 'POST' | 'GET' | 'DIALOG';
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
	}

	let {
		variant = 'primary',
		type = 'button',
		icon,
		iconRight,
		disabled = false,
		loading = false,
		formaction,
		formmethod,
		onclick,
		children
	}: Props = $props();

	const base =
		'inline-flex h-10 items-center justify-center gap-2 rounded-control px-5 text-sm font-medium transition-colors focus-visible:outline disabled:cursor-not-allowed disabled:opacity-50';

	const variants: Record<Variant, string> = {
		primary: 'bg-accent text-surface hover:opacity-90',
		secondary: 'border border-border bg-surface hover:bg-accent-soft',
		ghost: 'hover:bg-accent-soft',
		danger: 'border border-border bg-surface text-red-600 hover:bg-red-50'
	};

	const cls = $derived(`${base} ${variants[variant]}`);
</script>

<button
	{type}
	{onclick}
	{formaction}
	{formmethod}
	class={cls}
	disabled={disabled || loading}
	aria-busy={loading || undefined}
>
	{#if loading}
		<span
			class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent"
			aria-hidden="true"
		></span>
	{:else if icon}
		<Fa {icon} class="h-4 w-4" />
	{/if}
	{@render children?.()}
	{#if iconRight && !loading}<Fa icon={iconRight} class="h-4 w-4" />{/if}
</button>
