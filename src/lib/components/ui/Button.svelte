<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type Size = 'sm' | 'md';

	interface Props {
		variant?: Variant;
		size?: Size;
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
		size = 'md',
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

	const sizeClasses: Record<Size, string> = {
		sm: 'h-8 px-3 text-xs',
		md: 'h-10 px-5 text-sm'
	};
	const base =
		'inline-flex items-center justify-center gap-2 rounded-control font-medium transition-all duration-200 focus-visible:outline disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]';

	const variants: Record<Variant, string> = {
		primary: 'bg-accent text-surface shadow-card hover:shadow-float hover:opacity-90',
		secondary: 'border border-border bg-surface hover:bg-accent-soft',
		ghost: 'hover:bg-accent-soft',
		danger: 'border border-border bg-surface text-danger hover:bg-danger-soft'
	};

	const cls = $derived(`${base} ${sizeClasses[size]} ${variants[variant]}`);
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
