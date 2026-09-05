<script lang="ts">
	interface Props {
		id: string;
		label: string;
		value: string;
		type?: 'text' | 'email' | 'tel' | 'url' | 'date';
		placeholder?: string;
		hint?: string;
		required?: boolean;
		disabled?: boolean;
		multiline?: boolean;
		rows?: number;
		oninput?: (value: string) => void;
	}

	let {
		id,
		label,
		value = $bindable(''),
		type = 'text',
		placeholder = '',
		hint,
		required = false,
		disabled = false,
		multiline = false,
		rows = 3,
		oninput
	}: Props = $props();

	function handle(event: Event) {
		const target = event.target as HTMLInputElement | HTMLTextAreaElement;
		value = target.value;
		oninput?.(target.value);
	}
</script>

<div class="flex flex-col gap-1.5">
	<label for={id} class="text-sm font-medium">
		{label}
		{#if required}<span class="text-red-600">*</span>{/if}
	</label>
	{#if multiline}
		<textarea
			{id}
			{placeholder}
			{required}
			{disabled}
			{rows}
			{value}
			oninput={handle}
			class="min-h-20 rounded-control border border-border bg-surface px-3 py-2 text-sm leading-6 transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:outline disabled:cursor-not-allowed disabled:opacity-50"
		></textarea>
	{:else}
		<input
			{id}
			{type}
			{placeholder}
			{required}
			{disabled}
			{value}
			oninput={handle}
			class="h-10 rounded-control border border-border bg-surface px-3 text-sm transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:outline disabled:cursor-not-allowed disabled:opacity-50"
		/>
	{/if}
	{#if hint}<p class="text-xs text-ink-muted">{hint}</p>{/if}
</div>
