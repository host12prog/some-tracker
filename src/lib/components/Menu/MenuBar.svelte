<script lang="ts">
	import MenuButton from './MenuButton.svelte';
	import type { MenuItem } from './types';

	let activeMenu = $state('');
	let {
		menuItems = [],
		onAction
	}: {
		menuItems: MenuItem[];
		onAction?: (data: { action: string }) => void;
	} = $props();

	function handleMenuOpen(data: { label: string }) {
		activeMenu = data.label;
	}

	function handleMenuClose(data: { label?: string; all?: boolean }) {
		if (data.all) {
			activeMenu = '';
		} else if (data.label && activeMenu === data.label) {
			activeMenu = '';
		}
	}

	function handleAction(data: { action: string }) {
		onAction?.(data);
	}
</script>

<div class="flex w-full items-center border-b border-neutral-600 bg-neutral-700 px-2 text-center">
	{#each menuItems as item}
		<MenuButton
			label={item.label}
			items={item.items || []}
			{activeMenu}
			onAction={handleAction}
			onMenuOpen={handleMenuOpen}
			onMenuClose={handleMenuClose} />
	{/each}
</div>
