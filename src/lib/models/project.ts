import { Song } from './song';

class Project {
	constructor(
		public name: string,
		public author: string,
		public songs: Song[],
		public aymChipType: 'AY' | 'YM' = 'AY'
	) {}
}

export { Project };
