<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	interface Props {
		delay?: number;
		class?: string;
		children?: Snippet;
	}

	let { delay = 0, children, class: className = '' }: Props = $props();

	let el: HTMLElement | undefined = $state();
	let visible = $state(false);

	onMount(() => {
		if (!el) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			visible = true;
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						visible = true;
						observer.disconnect();
					}
				}
			},
			{ threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
		);
		observer.observe(el);
		return () => observer.disconnect();
	});
</script>

<div
	bind:this={el}
	class={`reveal ${visible ? 'is-visible' : ''} ${className}`}
	style={delay ? `transition-delay: ${delay}ms` : ''}
>
	{@render children?.()}
</div>
