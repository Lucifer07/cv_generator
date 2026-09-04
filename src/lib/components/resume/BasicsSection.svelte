<script lang="ts">
	import TextField from '$lib/components/ui/TextField.svelte';
	import type { ResumeDocument } from '$lib/stores/resumeDocument.svelte';

	interface Props {
		doc: ResumeDocument;
	}
	let { doc }: Props = $props();
</script>

<div class="flex flex-col gap-4">
	<TextField
		id="basics-fullName"
		label="Full name"
		value={doc.basics.fullName}
		oninput={(v) => doc.updateBasics('fullName', v)}
	/>
	<TextField
		id="basics-headline"
		label="Headline"
		placeholder="Senior Software Engineer"
		value={doc.basics.headline}
		oninput={(v) => doc.updateBasics('headline', v)}
	/>
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<TextField
			id="basics-email"
			label="Email"
			type="email"
			value={doc.basics.email}
			oninput={(v) => doc.updateBasics('email', v)}
		/>
		<TextField
			id="basics-phone"
			label="Phone"
			type="tel"
			value={doc.basics.phone}
			oninput={(v) => doc.updateBasics('phone', v)}
		/>
		<TextField
			id="basics-location"
			label="Location"
			value={doc.basics.location}
			oninput={(v) => doc.updateBasics('location', v)}
		/>
		<TextField
			id="basics-website"
			label="Website"
			type="url"
			placeholder="https://"
			value={doc.basics.website}
			oninput={(v) => doc.updateBasics('website', v)}
		/>
	</div>
	<TextField
		id="basics-summary"
		label="Summary"
		multiline
		rows={4}
		value={doc.basics.summary}
		oninput={(v) => doc.updateBasics('summary', v)}
	/>
</div>
