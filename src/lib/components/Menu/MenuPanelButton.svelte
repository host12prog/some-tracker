<script lang="ts">
	import MenuPanel from './MenuPanel.svelte';
	import type { MenuItem } from './types';
	import { getContext } from 'svelte';

	let {
		label,
		icon = '',
		type = 'normal',
		items,
		onAction,
		onMenuOpen,
		onMenuClose
	}: {
		label: string;
		icon: string;
		type: 'normal' | 'expandable';
		items: MenuItem[];
		onAction: (data: { action: string }) => void;
		onMenuOpen: (data: { label: string }) => void;
		onMenuClose: (data: { label?: string; all?: boolean }) => void;
	} = $props();

	const menuPanelContext = getContext<{
		setActiveSubmenu: (label: string) => void;
		getActiveSubmenu: () => string;
	}>('menuPanel');

	let localShowSubmenu = $state(false);

	const showSubmenuPanel = $derived(
		menuPanelContext && type === 'expandable'
			? menuPanelContext.getActiveSubmenu() === label
			: localShowSubmenu
	);

	const isActive = $derived(showSubmenuPanel && type === 'expandable');

	function handleClick(event: MouseEvent) {
		event.stopPropagation();

		if (type === 'normal') {
			onAction?.({ action: label });
			onMenuClose?.({ all: true });
		} else if (type === 'expandable') {
			if (menuPanelContext) {
				menuPanelContext.setActiveSubmenu(label);
			} else {
				localShowSubmenu = !localShowSubmenu;
			}
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();

			if (type === 'normal') {
				onAction?.({ action: label });
				onMenuClose?.({ all: true });
			} else if (type === 'expandable') {
				if (menuPanelContext) {
					menuPanelContext.setActiveSubmenu(label);
				} else {
					localShowSubmenu = !localShowSubmenu;
				}
			}
		} else if (event.key === 'Escape') {
			onMenuClose?.({ all: true });
		}
	}

	function handleAction(data: { action: string }) {
		onAction?.(data);
	}

	function handleMenuOpen(data: { label: string }) {
		onMenuOpen?.(data);
	}

	function handleMenuClose(data: { label?: string; all?: boolean }) {
		if (data.all) {
			if (!menuPanelContext) {
				localShowSubmenu = false;
			}
		}
		onMenuClose?.(data);
	}

	$effect.root(() => {
		return () => {
			if (!menuPanelContext) {
				localShowSubmenu = false;
			}
		};
	});
</script>

<div
	class="menu-panel-button relative flex cursor-pointer items-center justify-between px-2 py-1.5 text-[0.8rem] hover:bg-neutral-700"
	onclick={handleClick}
	onkeydown={handleKeyDown}
	tabindex="0"
	role="menuitem"
	class:bg-neutral-700={isActive}>
	<div class="flex items-center gap-2">
		{#if icon}
			<span>{icon}</span>
		{/if}
		<span>{label}</span>
	</div>

	{#if type === 'expandable'}
		<span class="text-xs">▶</span>
	{/if}

	{#if showSubmenuPanel && type === 'expandable' && items && items.length > 0}
		<div class="absolute top-0 left-full ml-0.5">
			<MenuPanel
				{items}
				onAction={handleAction}
				onMenuOpen={handleMenuOpen}
				onMenuClose={handleMenuClose} />
		</div>
	{/if}
</div>
