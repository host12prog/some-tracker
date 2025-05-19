<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import MenuPanelButton from './MenuPanelButton.svelte';
	import type { MenuItem } from './types';
	import { setContext } from 'svelte';

	let { items, onAction, onMenuOpen, onMenuClose } = $props<{
		items?: MenuItem[];
		onAction?: (action: { action: string }) => void;
		onMenuOpen?: (data: { label: string }) => void;
		onMenuClose?: (data: { label?: string; all?: boolean }) => void;
	}>();

	let activeSubmenu = $state('');

	setContext('menuPanel', {
		setActiveSubmenu: (label: string) => {
			activeSubmenu = activeSubmenu === label ? '' : label;
		},
		getActiveSubmenu: () => activeSubmenu
	});

	function handleAction(data: { action: string }) {
		onAction?.(data);
	}

	function handleMenuOpen(data: { label: string }) {
		onMenuOpen?.(data);
	}

	function handleMenuClose(data: { label?: string; all?: boolean }) {
		if (data.all) {
			activeSubmenu = '';
		}
		onMenuClose?.(data);
	}

	function handlePanelClick(event: MouseEvent) {
		event.stopPropagation();
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	in:fly={{ y: -10, duration: 150 }}
	out:fade={{ duration: 80 }}
	tabindex="-1"
	class="menu-panel w-48 rounded-sm border border-neutral-600 bg-neutral-800 shadow-lg"
	onclick={handlePanelClick}
	role="menu">
	{#if items && items.length > 0}
		{#each items as item}
			<MenuPanelButton
				label={item.label}
				icon={item.icon || ''}
				type={item.type || 'normal'}
				items={item.items || []}
				onAction={handleAction}
				onMenuOpen={handleMenuOpen}
				onMenuClose={handleMenuClose} />
		{/each}
	{/if}
</div>

<style>
	.menu-panel {
		min-width: 180px;
	}
</style>
