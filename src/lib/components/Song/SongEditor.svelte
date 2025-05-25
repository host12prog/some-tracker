<script lang="ts">
	import type { Pattern } from '../../models/song';
	import PatternEditor from './PatternEditor.svelte';
	import PatternOrder from './PatternOrder.svelte';

	let currentPatternOrderIndex = $state(0);
	let selectedRow = $state(0);
	let {
		patterns = $bindable(),
		patternOrder = $bindable()
	}: { patterns: Pattern[]; patternOrder: number[] } = $props();
</script>

<div>
	<PatternOrder bind:currentPatternOrderIndex bind:patterns bind:selectedRow bind:patternOrder />
	<PatternEditor bind:currentPatternOrderIndex bind:patterns bind:selectedRow bind:patternOrder />
</div>
