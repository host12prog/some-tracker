<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, onclick }: { children: Snippet; onclick: () => void } = $props();
</script>

<button
	{onclick}
	class="cursor-pointer rounded border border-neutral-600 bg-[var(--pattern-bg)] px-3
		py-1
		hover:bg-[var(--pattern-selected)] focus:border-transparent focus:ring-1 focus:ring-[var(--pattern-note)] focus:outline-none">
	{@render children()}
</button>
