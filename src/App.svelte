<script lang="ts">
	import MenuBar from './lib/components/Menu/MenuBar.svelte';
	import './app.css';
	import { menuItems } from './lib/config/app-menu';
	import { handleFileImport } from './lib/services/file-import';
	import { Project } from './lib/models/project';
	import Button from './lib/components/Button/Button.svelte';
	import PatternEditor from './lib/components/Song/PatternEditor.svelte';

	let project = $state(new Project());
	let patternEditor: PatternEditor | null = $state(null);

	async function handleMenuAction(data: { action: string }) {
		try {
			const importedProject = await handleFileImport(data.action);
			if (importedProject) {
				project = importedProject;
				patternEditor?.onSongChange();
			}
		} catch (error) {
			console.error('Failed to handle menu action:', error);
		}
	}

	async function changeAymChipType() {
		project.aymChipType = project.aymChipType === 'AY' ? 'YM' : 'AY';
		project = { ...project };
	}
</script>

<main
	class="flex h-screen flex-col overflow-x-hidden bg-neutral-800 font-sans text-xs text-neutral-100">
	<MenuBar {menuItems} onAction={handleMenuAction} />
	<div class="flex flex-col gap-3 overflow-x-auto p-3">
		<div class="ml-0 w-full max-w-2xl rounded bg-neutral-700 p-3 shadow-md">
			<div class="flex flex-wrap items-center gap-3">
				<div class="flex min-w-0 flex-1 items-center gap-1">
					<span class="shrink-0">Title:</span>
					<input
						type="text"
						bind:value={project.name}
						class="min-w-0 flex-1 overflow-x-auto rounded border border-neutral-600 bg-neutral-900 px-2 py-1 focus:border-transparent focus:ring-1 focus:ring-blue-500 focus:outline-none" />
				</div>
				<div class="flex min-w-0 flex-1 items-center gap-1">
					<span class="shrink-0">Author:</span>
					<input
						type="text"
						bind:value={project.author}
						class="min-w-0 flex-1 overflow-x-auto rounded border border-neutral-600 bg-neutral-900 px-2 py-1 focus:border-transparent focus:ring-1 focus:ring-blue-500 focus:outline-none" />
				</div>
				<Button onclick={changeAymChipType}>{project.aymChipType}</Button>
			</div>
		</div>
		<div class="mx-auto">
			{#each project.songs as song}
				<PatternEditor
					bind:this={patternEditor}
					bind:patterns={song.patterns}
					bind:patternOrder={project.patternOrder} />
			{/each}
		</div>
	</div>
</main>
