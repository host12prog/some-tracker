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
				? 'cursor-default rounded-sm border border-blue-400 bg-blue-600 text-slate-200'
				: 'cursor-pointer rounded-sm border border-slate-400 bg-slate-500 text-slate-900 hover:bg-slate-400'}"
			onclick={() => switchPattern(i)}>
			{patterns[patternIndex].id}
		</button>
	{/each}
</div>
