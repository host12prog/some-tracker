<script lang="ts">
	import MenuPanel from './MenuPanel.svelte';
	import type { MenuItem } from './types';

	let { label, items, activeMenu, onAction, onMenuOpen, onMenuClose } = $props<{
		label?: string;
		items?: MenuItem[];
		activeMenu?: string;
		onAction?: (action: any) => void;
		onMenuOpen?: (data: { label: string }) => void;
		onMenuClose?: (data: { label?: string; all?: boolean }) => void;
	}>();

	const showPanel = $derived(activeMenu === label);

	function handleClick(event: MouseEvent) {
		event.stopPropagation();

		if (showPanel) {
			onMenuClose?.({ label });
		} else {
			onMenuOpen?.({ label });
		}
	}

	function handleClickOutside(event: MouseEvent & { target: HTMLElement }) {
		if (
			showPanel &&
			!event.target.closest('.menu-button-container') &&
			!event.target.closest('.menu-panel')
		) {
			onMenuClose?.({ all: true });
		}
	}

	$effect(() => {
		if (showPanel) {
			document.addEventListener('click', handleClickOutside as EventListener);
			return () => document.removeEventListener('click', handleClickOutside as EventListener);
		}
	});
</script>

<div class="menu-button-container relative">
	<button
		onclick={handleClick}
		class="menu-button px-2 pt-2 pb-1 text-[0.8rem] hover:bg-neutral-600"
		class:bg-neutral-600={showPanel}>
		{label}
	</button>

	{#if showPanel && items && items.length > 0}
		<div class="absolute top-full left-0 z-50">
			<MenuPanel {items} {onAction} {onMenuOpen} {onMenuClose} />
		</div>
	{/if}
</div>
