<script lang="ts">
	import type { Pattern } from '../../models/song';
	import PatternEditor from './PatternEditor.svelte';
	import PatternOrder from './PatternOrder.svelte';

	let currentPatternIndex = $state(0);
	let { patterns = $bindable() }: { patterns: Pattern[] } = $props();
</script>

<div>
	<PatternOrder bind:currentPatternIndex bind:patterns />
	<PatternEditor bind:currentPatternIndex bind:patterns />
</div>
