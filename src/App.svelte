<script lang="ts">
	import { generateTestSong, Song } from './lib/models/song';
	import MenuBar from './lib/components/Menu/MenuBar.svelte';
	import './app.css';
	import { menuItems } from './lib/config/app-menu';
	import SongEditor from './lib/components/Song/SongEditor.svelte';

	let song = $state(generateTestSong());
</script>

<main class="flex h-screen flex-col bg-neutral-800 font-sans text-xs text-neutral-100">
	<MenuBar {menuItems} />
	<div class="flex flex-col gap-3 p-3">
		<div class="ml-0 max-w-fit rounded bg-neutral-700 p-3 shadow-md">
			<div class="flex items-center gap-3">
				<div class="flex items-center gap-1">
					<span>Title:</span>
					<input
						type="text"
						bind:value={song.title}
						class="w-70 rounded border border-neutral-600 bg-neutral-900 px-2 py-1 focus:border-transparent focus:ring-1 focus:ring-blue-500 focus:outline-none" />
				</div>
				<div class="flex items-center gap-1">
					<span>Author:</span>
					<input
						type="text"
						bind:value={song.author}
						class="w-70 rounded border border-neutral-600 bg-neutral-900 px-2 py-1 focus:border-transparent focus:ring-1 focus:ring-blue-500 focus:outline-none" />
				</div>
			</div>
		</div>
		<div class="mx-auto">
			<SongEditor bind:patterns={song.patterns} />
		</div>
	</div>
</main>
