<script lang="ts">
	import { onMount } from 'svelte';
	import Fa from 'svelte-fa';
	import { icons } from '$lib/icons';
	import { parseAssistantResponse } from '$lib/schemas/ai';

	interface Props {
		onApplyStrategy: (
			strategy: 'summary' | 'rewrite' | 'tailor' | 'review' | 'chat',
			context?: Record<string, unknown>
		) => Promise<string>;
		onApplyEdits?: (actions: import('$lib/schemas/ai').EditAction[]) => number;
		disabled?: boolean;
	}

	let { onApplyStrategy, onApplyEdits, disabled = false }: Props = $props();

	let open = $state(false);
	let messages = $state<Array<{ role: 'user' | 'assistant'; content: string; applied?: number }>>(
		[]
	);
	let input = $state('');
	let streaming = $state(false);
	let error = $state<string | null>(null);

	type QuickAction = 'summary' | 'rewrite' | 'tailor' | 'review';

	const quickActions: Array<{
		id: QuickAction;
		label: string;
		desc: string;
		icon: typeof icons.ai;
	}> = [
		{
			id: 'summary',
			label: 'Generate summary',
			desc: 'Create a professional summary from the CV',
			icon: icons.ai
		},
		{
			id: 'rewrite',
			label: 'Rewrite bullets',
			desc: 'Improve experience bullet points',
			icon: icons.edit
		},
		{
			id: 'tailor',
			label: 'Tailor to job',
			desc: 'Adapt CV to a job description',
			icon: icons.key
		},
		{
			id: 'review',
			label: 'Review CV',
			desc: 'Get suggestions for improvement',
			icon: icons.warning
		}
	];

	async function runQuickAction(action: QuickAction) {
		if (streaming) return;
		streaming = true;
		error = null;
		messages = [...messages, { role: 'user', content: actionLabel(action) }];

		try {
			const result = await onApplyStrategy(action);
			messages = [...messages, { role: 'assistant', content: result }];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Action failed';
			messages = [...messages, { role: 'assistant', content: `Error: ${error}` }];
		} finally {
			streaming = false;
		}
	}

	async function sendMessage() {
		if (!input.trim() || streaming) return;
		const text = input.trim();
		input = '';
		streaming = true;
		error = null;
		messages = [...messages, { role: 'user', content: text }];

		try {
			const result = await onApplyStrategy('chat', { customPrompt: text });
			const parsed = parseAssistantResponse(result);
			if (parsed && onApplyEdits && parsed.actions.length > 0) {
				const applied = onApplyEdits(parsed.actions);
				messages = [
					...messages,
					{
						role: 'assistant',
						content:
							parsed.reply +
							(applied > 0
								? `\n\n[Applied ${applied} change${applied === 1 ? '' : 's'} to your CV — saved automatically.]`
								: '\n\n[No changes were applicable — please rephrase.]'),
						applied
					}
				];
			} else {
				messages = [...messages, { role: 'assistant', content: result }];
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Action failed';
			messages = [...messages, { role: 'assistant', content: `Error: ${error}` }];
		} finally {
			streaming = false;
		}
	}

	function actionLabel(action: QuickAction): string {
		return quickActions.find((a) => a.id === action)?.label ?? action;
	}

	onMount(() => {
		// Welcome message
		messages = [
			{
				role: 'assistant',
				content:
					'Hi! I can help you improve your CV. Choose a quick action below or type a request.'
			}
		];
	});
</script>

<div class="fixed right-6 bottom-6 z-50" aria-label="AI Assistant">
	<button
		type="button"
		onclick={() => (open = !open)}
		class="inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent text-surface shadow-lg transition-all hover:scale-105 focus-visible:outline"
		aria-label={open ? 'Close AI Assistant' : 'Open AI Assistant'}
		aria-expanded={open}
	>
		{#if open}
			<Fa icon={icons.dismiss} class="h-6 w-6" />
		{:else}
			<Fa icon={icons.ai} class="h-6 w-6" />
		{/if}
	</button>

	{#if open}
		<div
			class="absolute right-0 bottom-full mb-3 flex max-h-[70vh] w-96 flex-col overflow-hidden rounded-card border border-border bg-surface shadow-xl"
			role="dialog"
			aria-label="AI Assistant"
		>
			<header
				class="flex items-center justify-between border-b border-border bg-surface-alt px-4 py-3"
			>
				<h3 class="flex items-center gap-2 text-sm font-semibold">
					<Fa icon={icons.ai} class="h-4 w-4" />
					AI Assistant
				</h3>
				<button
					type="button"
					onclick={() => (open = false)}
					class="inline-flex h-8 w-8 items-center justify-center rounded-control text-ink-muted hover:bg-accent-soft"
					aria-label="Close"
				>
					<Fa icon={icons.dismiss} class="h-4 w-4" />
				</button>
			</header>

			<div class="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
				{#each messages as msg, idx (idx)}
					<div class="flex gap-2 {msg.role === 'user' ? 'justify-end' : ''}">
						<div
							class="max-w-[80%] rounded-lg px-3 py-2 text-sm leading-5 {msg.role === 'user'
								? 'bg-accent text-surface'
								: 'bg-surface-alt text-ink'}"
						>
							{#if typeof msg.applied === 'number' && msg.applied > 0}
								<span
									class="mb-1 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-surface"
								>
									<Fa icon={icons.success} class="h-2.5 w-2.5" />
									{msg.applied} edit{msg.applied === 1 ? '' : 's'} applied
								</span>
							{/if}
							{msg.content}
						</div>
					</div>
				{/each}

				{#if streaming}
					<div class="flex gap-2">
						<div
							class="animate-pulse rounded-lg bg-surface-alt px-3 py-2 text-sm leading-5 text-ink"
						>
							<span class="mr-1 inline-block h-4 w-4 rounded-full bg-ink"></span>
							<span class="inline-block h-4 w-6 rounded-full bg-ink"></span>
							<span class="inline-block h-4 w-4 rounded-full bg-ink"></span>
						</div>
					</div>
				{/if}
			</div>

			{#if error}
				<div class="border-t border-border bg-surface-alt p-3 text-xs text-red-600">{error}</div>
			{/if}

			<footer class="border-t border-border bg-surface-alt p-4">
				<div class="mb-3 flex flex-wrap gap-2" role="group" aria-label="Quick actions">
					{#each quickActions as action (action.id)}
						<button
							type="button"
							onclick={() => runQuickAction(action.id)}
							disabled={streaming || disabled}
							class="inline-flex h-8 items-center gap-1.5 rounded-control border border-border bg-surface px-3 text-xs font-medium text-ink-muted hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
						>
							<Fa icon={action.icon} class="h-3.5 w-3.5" />
							{action.label}
						</button>
					{/each}
				</div>

				<div class="flex items-center gap-2">
					<input
						type="text"
						bind:value={input}
						onkeydown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
						placeholder="Ask me to review, rewrite, or tailor your CV…"
						class="h-10 flex-1 rounded-control border border-border bg-surface px-3 text-sm outline-none focus-visible:outline disabled:opacity-50"
						disabled={streaming || disabled}
						aria-label="Chat message"
					/>
					<button
						type="button"
						onclick={sendMessage}
						disabled={!input.trim() || streaming || disabled}
						class="inline-flex h-10 items-center gap-2 rounded-control bg-accent px-4 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
						aria-label="Send"
					>
						<Fa icon={icons.send} class="h-4 w-4" />
					</button>
				</div>
			</footer>
		</div>
	{/if}
</div>
