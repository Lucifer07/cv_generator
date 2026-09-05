<script lang="ts">
	import { enhance } from '$app/forms';
	import Fa from 'svelte-fa';
	import { icons } from '$lib/icons';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let endpoint = $state<string>(data.endpoint ?? '');
	let token = $state<string>('');
	let model = $state<string>(data.model ?? '');
	let testing = $state(false);
	let saving = $state(false);
	let verifiedAt = $state<number | null>(null);
	let verifiedKey = $state<string>('');

	$effect(() => {
		if (form && 'success' in form && form.success) {
			verifiedAt = null;
			verifiedKey = '';
			token = '';
		}
	});

	const fieldsChanged = $derived(
		endpoint !== (data.endpoint ?? '') ||
			model !== (data.model ?? '') ||
			(token.length > 0 && !data.hasCredential) ||
			(token.length > 0 && data.hasCredential === true)
	);

	const isCurrentValid = $derived(endpoint.trim().length > 0 && model.trim().length > 0);

	const canTest = $derived(
		isCurrentValid && (token.length > 0 || data.hasCredential) && !testing && !saving
	);

	const canSave = $derived(
		isCurrentValid && (token.length > 0 || data.hasCredential) && !saving && !testing
	);

	const verifiedForCurrent = $derived(
		verifiedKey !== '' &&
			verifiedKey === `${endpoint}|${model}|${token.length > 0 ? 'token' : 'existing'}` &&
			verifiedAt !== null
	);
</script>

<svelte:head>
	<title>Settings | CV Generator</title>
</svelte:head>

<div class="mx-auto w-full max-w-3xl px-6 py-12">
	<h1 class="text-2xl font-semibold tracking-tight">AI credentials</h1>
	<p class="mt-2 text-sm leading-6 text-ink-muted">
		Connect an OpenAI-compatible endpoint. Your token is encrypted at rest and never returned to
		this page after submission.
	</p>

	{#if data.hasCredential && !fieldsChanged && !form?.success}
		<div class="mt-8 rounded-card border border-border bg-surface p-5">
			<div class="flex items-start gap-3">
				<Fa icon={icons.success} class="mt-0.5 h-4 w-4 shrink-0" />
				<div class="min-w-0">
					<p class="text-sm font-medium">Credentials configured</p>
					<dl class="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
						<div>
							<dt class="text-ink-muted">Endpoint</dt>
							<dd class="truncate font-mono text-xs">{data.endpoint}</dd>
						</div>
						<div>
							<dt class="text-ink-muted">Model</dt>
							<dd class="font-mono text-xs">{data.model ?? '—'}</dd>
						</div>
						<div class="sm:col-span-2">
							<dt class="text-ink-muted">Last verified</dt>
							<dd class="text-xs">
								{data.lastVerifiedAt ? new Date(data.lastVerifiedAt).toLocaleString() : '—'}
							</dd>
						</div>
					</dl>
				</div>
			</div>
		</div>
	{/if}

	{#if form && 'message' in form && form.message}
		<div
			class="mt-6 flex items-start gap-3 rounded-control border border-border bg-surface-alt p-4 text-sm leading-6"
			role="alert"
		>
			<Fa icon={icons.warning} class="mt-0.5 h-4 w-4 shrink-0" />
			<span>{form.message}</span>
		</div>
	{/if}
	{#if form && 'verified' in form && form.verified}
		<div
			class="mt-6 flex items-start gap-3 rounded-control border border-border bg-surface-alt p-4 text-sm leading-6"
			role="status"
		>
			<Fa icon={icons.success} class="mt-0.5 h-4 w-4 shrink-0" />
			<span>
				Connection verified{form.modelId ? ` (detected model: ${form.modelId})` : ''}. You can now
				save credentials.
			</span>
		</div>
	{/if}
	{#if form && 'success' in form && form.success}
		<div
			class="mt-6 flex items-start gap-3 rounded-control border border-border bg-surface-alt p-4 text-sm leading-6"
			role="status"
		>
			<Fa icon={icons.success} class="mt-0.5 h-4 w-4 shrink-0" />
			<span>Credentials saved. Token encrypted at rest.</span>
		</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			return async ({ result, update }) => {
				testing = false;
				saving = false;
				await update();
				if (result.type === 'success' && result.data && 'verified' in (result.data ?? {})) {
					verifiedAt = Date.now();
					verifiedKey = `${endpoint}|${model}|${token.length > 0 ? 'token' : 'existing'}`;
				}
			};
		}}
		class="mt-8 flex flex-col gap-5 rounded-card border border-border bg-surface p-6"
	>
		<h2 class="text-sm font-semibold">
			{data.hasCredential ? 'Update credentials' : 'Add credentials'}
		</h2>

		<div class="flex flex-col gap-1.5">
			<label for="endpoint" class="text-sm font-medium">
				Endpoint URL <span class="text-red-600">*</span>
			</label>
			<input
				id="endpoint"
				name="endpoint"
				type="url"
				placeholder="https://api.openai.com/v1"
				bind:value={endpoint}
				required
				class="h-10 rounded-control border border-border bg-surface px-3 text-sm outline-none focus-visible:outline"
			/>
			<p class="text-xs text-ink-muted">
				Use the base URL. Do not include a path like <code>/chat/completions</code>.
			</p>
		</div>

		<div class="flex flex-col gap-1.5">
			<label for="token" class="text-sm font-medium">
				API token {data.hasCredential ? '(leave blank to keep current)' : ''}
			</label>
			<input
				id="token"
				name="token"
				type="password"
				bind:value={token}
				required={!data.hasCredential}
				autocomplete="off"
				class="h-10 rounded-control border border-border bg-surface px-3 text-sm outline-none focus-visible:outline"
			/>
			<p class="text-xs text-ink-muted">
				Stored encrypted with AES-256-GCM. The token is never sent to the browser after submission.
			</p>
		</div>

		<div class="flex flex-col gap-1.5">
			<label for="model" class="text-sm font-medium">
				Default model <span class="text-red-600">*</span>
			</label>
			<input
				id="model"
				name="model"
				type="text"
				placeholder="gpt-4o-mini"
				bind:value={model}
				required
				class="h-10 rounded-control border border-border bg-surface px-3 text-sm outline-none focus-visible:outline"
			/>
			<p class="text-xs text-ink-muted">
				Will be used for AI features. You can override per-request in the editor.
			</p>
		</div>

		<div class="flex items-center justify-end gap-3 pt-2">
			<button
				type="submit"
				formaction="?/test"
				disabled={!canTest}
				class="inline-flex h-10 items-center gap-2 rounded-control border border-border bg-surface px-5 text-sm font-medium transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
			>
				<Fa icon={testing ? icons.dismiss : icons.key} class="h-4 w-4" />
				{testing ? 'Testing…' : 'Test connection'}
			</button>

			{#if verifiedForCurrent}
				<button
					type="submit"
					formaction="?/save"
					disabled={!canSave}
					onsubmitcapture={() => (saving = true)}
					class="inline-flex h-10 items-center gap-2 rounded-control bg-accent px-5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<Fa icon={saving ? icons.dismiss : icons.success} class="h-4 w-4" />
					{saving ? 'Saving…' : data.hasCredential ? 'Update credentials' : 'Save credentials'}
				</button>
			{/if}
		</div>
	</form>

	{#if data.hasCredential}
		<form method="POST" action="?/delete" use:enhance class="mt-3 flex items-center justify-end">
			<button
				type="submit"
				class="inline-flex h-9 items-center rounded-control border border-border px-4 text-xs font-medium text-ink-muted transition-colors hover:bg-accent-soft"
			>
				Remove saved credentials
			</button>
		</form>
	{/if}
</div>
