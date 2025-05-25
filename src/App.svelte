<script lang="ts">
	import { generateTestSong, Song } from './lib/models/song';
	import MenuBar from './lib/components/Menu/MenuBar.svelte';
	import './app.css';
	import { menuItems } from './lib/config/app-menu';
	import SongEditor from './lib/components/Song/SongEditor.svelte';

	let song = $state(generateTestSong());
</script>

<main
	class="flex h-screen flex-col overflow-x-hidden bg-neutral-800 font-sans text-xs text-neutral-100">
	<MenuBar {menuItems} />
	<div class="flex flex-col gap-3 overflow-x-auto p-3">
		<div class="ml-0 w-full max-w-2xl rounded bg-neutral-700 p-3 shadow-md">
			<div class="flex flex-wrap items-center gap-3">
				<div class="flex min-w-0 flex-1 items-center gap-1">
					<span class="shrink-0">Title:</span>
					<input
						type="text"
						bind:value={song.title}
						class="min-w-0 flex-1 overflow-x-auto rounded border border-neutral-600 bg-neutral-900 px-2 py-1 focus:border-transparent focus:ring-1 focus:ring-blue-500 focus:outline-none" />
				</div>
				<div class="flex min-w-0 flex-1 items-center gap-1">
					<span class="shrink-0">Author:</span>
					<input
						type="text"
						bind:value={song.author}
						class="min-w-0 flex-1 overflow-x-auto rounded border border-neutral-600 bg-neutral-900 px-2 py-1 focus:border-transparent focus:ring-1 focus:ring-blue-500 focus:outline-none" />
				</div>
			</div>
		</div>
		<div class="mx-auto">
			<SongEditor bind:patterns={song.patterns} bind:patternOrder={song.patternOrder} />
		</div>
	</div>
</main>
