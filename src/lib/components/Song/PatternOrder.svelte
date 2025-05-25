<script lang="ts">
	import type { Pattern } from '../../models/song';

	let {
		currentPatternOrderIndex = $bindable(),
		patterns = $bindable(),
		selectedRow = $bindable(),
		patternOrder = $bindable()
	}: {
		currentPatternOrderIndex: number;
		patterns: Pattern[];
		selectedRow: number;
		patternOrder: number[];
	} = $props();

	function switchPattern(index: number) {
		currentPatternOrderIndex = index;
		selectedRow = 0;
	}
</script>

<div
	class="text-md mb-1 flex flex-shrink-0 gap-[2px] overflow-auto text-center font-mono shadow-slate-900 select-none">
	{#each patternOrder as patternIndex, i (i)}
		<button
			class="h-7 w-7 flex-shrink-0 {i === currentPatternOrderIndex
				? 'cursor-default rounded-sm border border-[var(--pattern-header)] bg-[var(--pattern-selected)] text-[var(--pattern-text)]'
				: 'cursor-pointer rounded-sm border border-[var(--pattern-empty)] bg-[var(--pattern-bg)] text-[var(--pattern-text)] hover:bg-[var(--pattern-alternate)]'}"
			onclick={() => switchPattern(i)}>
			{patterns[patternIndex].id}
		</button>
	{/each}
</div>
