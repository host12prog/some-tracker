import { Project } from '../models/project';
import { Song, Pattern, Note, Effect, NoteName, EffectType } from '../models/song';
import { PT3TuneTables } from '../models/pt3/tuning-tables';

interface PT3Ornament {
	id: number;
	data: number[];
	loop: boolean;
	loopPoint: number;
}

interface PT3Sample {
	id: number;
	data: PT3SampleLine[];
}

interface PT3SampleLine {
	tone: boolean;
	noise: boolean;
	envelope: boolean;
	toneAdd: number;
	noiseAdd: number;
	volume: number;
	loop: boolean;
}

interface PT3PatternRow {
	note: string;
	instrument: number;
	volume: number;
	ornament: number;
	envelopeShape: number;
	effects: string;
}

interface PT3Pattern {
	id: number;
	rows: PT3PatternRow[][];
	envelopeValues: number[];
	noiseValues: number[];
}

class PT3Converter {
	private pattern_pointer: number = 0;
	private pattern_order: number[] = [];
	private sample_pointer: number[] = [];
	private ornament_pointer: number[] = [];
	private chan_a_pattern: number[] = [];
	private chan_b_pattern: number[] = [];
	private chan_c_pattern: number[] = [];
	private pt3Content: Uint8Array = new Uint8Array();

	// prettier-ignore
	private readonly NOTE_NAMES: string[] = [
		"C-1", "C#1", "D-1", "D#1", "E-1", "F-1", "F#1", "G-1", "G#1", "A-1", "A#1", "B-1",
		"C-2", "C#2", "D-2", "D#2", "E-2", "F-2", "F#2", "G-2", "G#2", "A-2", "A#2", "B-2",
		"C-3", "C#3", "D-3", "D#3", "E-3", "F-3", "F#3", "G-3", "G#3", "A-3", "A#3", "B-3",
		"C-4", "C#4", "D-4", "D#4", "E-4", "F-2", "F#4", "G-4", "G#4", "A-4", "A#4", "B-4",
		"C-5", "C#5", "D-5", "D#5", "E-5", "F-5", "F#5", "G-5", "G#5", "A-5", "A#5", "B-5",
		"C-6", "C#6", "D-6", "D#6", "E-6", "F-6", "F#6", "G-6", "G#6", "A-6", "A#6", "B-6",
		"C-7", "C#7", "D-7", "D#7", "E-7", "F-7", "F#7", "G-7", "G#7", "A-7", "A#7", "B-7",
		"C-8", "C#8", "D-8", "D#8", "E-8", "F-8", "F#8", "G-8", "G#8", "A-8", "A#8", "B-8",
	] as const;

	private readonly noteNameMap: Record<string, NoteName> = {
		C: NoteName.C,
		'C#': NoteName.CSharp,
		D: NoteName.D,
		'D#': NoteName.DSharp,
		E: NoteName.E,
		F: NoteName.F,
		'F#': NoteName.FSharp,
		G: NoteName.G,
		'G#': NoteName.GSharp,
		A: NoteName.A,
		'A#': NoteName.ASharp,
		B: NoteName.B
	} as const;

	convert(file: Uint8Array): Project {
		this.pt3Content = file;
		const decode = new TextDecoder();
		const song = new Song();

		const magic: string = decode.decode(this.pt3Content.slice(0, 0x0d));
		const version: number = this.pt3Content[0x0d];
		const id: string = decode.decode(this.pt3Content.slice(0, 0x1d));

		const title: string = decode.decode(this.pt3Content.slice(0x1e, 0x3e));
		// after this there is 4 bytes: " by ", so we ignore this
		const author: string = decode.decode(this.pt3Content.slice(0x42, 0x62));

		const tone_table: number = this.pt3Content[0x63];
		const speed: number = this.pt3Content[0x64];
		const length: number = this.pt3Content[0x65];
		const loop: number = this.pt3Content[0x66];

		// get the sample and ornament pointers
		// 32 sample pointers: 64 bytes
		// 16 ornament pointers: 32 bytes
		for (let i = 0; i < 64; i += 2) {
			this.sample_pointer.push((this.pt3Content[0x6a + i] << 8) | this.pt3Content[0x69 + i]);
		}
		for (let i = 0; i < 32; i += 2) {
			this.ornament_pointer.push(
				(this.pt3Content[0xaa + i] << 8) | this.pt3Content[0xa9 + i]
			);
		}
		console.log(this.sample_pointer, this.ornament_pointer);

		for (let i = 0xc9; this.pt3Content[i] != 0xff; i++) {
			this.pattern_order.push(this.pt3Content[i] / 3);
		}
		song.tuningTable = PT3TuneTables[tone_table];
		song.initialSpeed = speed;
		this.pattern_pointer = (this.pt3Content[0x68] << 8) | this.pt3Content[0x67];
		const patterns = this.parsePatterns();

		song.patterns = patterns.map((pt3pattern) => {
			const pattern = new Pattern(pt3pattern.id, pt3pattern.rows.length);
			this.convertPattern(pt3pattern, pattern);
			return pattern;
		});

		console.log(magic, version, id, tone_table, speed, length, loop);
		console.log('pattern pointer: ', this.pattern_pointer);
		console.log(this.pattern_order);
		const project = new Project(title, author, [song], loop);
		return project;
	}

	private parsePatterns(): PT3Pattern[] {
		var max_pattern = Math.max(...this.pattern_order);
		// get the pattern pointers
		for (let i = 0; i < max_pattern; i++) {
			this.chan_a_pattern.push(
				(this.pt3Content[this.pattern_pointer + 1 + i * 6] << 8) |
					this.pt3Content[this.pattern_pointer + i * 6]
			);
			this.chan_b_pattern.push(
				(this.pt3Content[this.pattern_pointer + 3 + i * 6] << 8) |
					this.pt3Content[this.pattern_pointer + 2 + i * 6]
			);
			this.chan_c_pattern.push(
				(this.pt3Content[this.pattern_pointer + 5 + i * 6] << 8) |
					this.pt3Content[this.pattern_pointer + 4 + i * 6]
			);
		}

		var eop: boolean[] = [false, false, false];
		var chan_index = [this.chan_a_pattern, this.chan_b_pattern, this.chan_c_pattern];
		let idx = chan_index[0][0];
		var stop = false;
		var iscmd = false;
		var cmd;
		var note: string = '';
		var instrument: number = 0;
		var ornament: number = 0;
		var volume: number = 0;
		var envelopeShape: number = 0;
		var effects: string = '';
		const patternRows: PT3PatternRow[][] = [[], [], []];
		const pattern: PT3Pattern = {
			id: 0,
			rows: [],
			envelopeValues: [],
			noiseValues: []
		};
		//for (let pattern = 0; pattern < 1; pattern++) {
		//	for (let i = 0; i < 3; i++) {
		//if (eop[i]) continue;
		while (!stop) {
			let data = this.pt3Content[idx];
			if (Number.isNaN(data) || data == undefined) stop = true;
			if (data >= 0x01 && data <= 0x09) {
				iscmd = true;
				cmd = data;
			}
			if (data >= 0x11 && data <= 0x1f) console.log('envelope');
			if (data >= 0x20 && data <= 0x3f) console.log('noise', data - 0x20);
			if (data >= 0x40 && data <= 0x4f) {
				ornament = data - 0x40;
				console.log('ornament', ornament);
			}
			if (data >= 0x50 && data <= 0xaf) {
				note = this.NOTE_NAMES[data - 0x50];
				console.log('note', data - 0x50, note);
			}
			if (data >= 0xc1 && data <= 0xcf) {
				volume = data & 0x0f;
				console.log('volume', volume);
			}
			if (data >= 0xd1 && data <= 0xef) {
				instrument = data - 0xd0;
				console.log('sample', instrument);
			}
			if (data >= 0xf0 && data <= 0xff) {
				console.log('init ornament', data & 0x0f);
				idx++;
				console.log('set sample', this.pt3Content[idx] >> 1);
			}

			switch (data) {
				case 0x00:
					stop = true;
					break;
				case 0x10:
					console.log('disable envelope and set sample', this.pt3Content[idx]++ >> 1);
					break;
				case 0xb1:
					console.log(idx);
					let new_idx = this.pt3Content[idx++] - 1;
					idx += new_idx;
					console.log(new_idx, idx);
					break;
				case 0xd0:
					stop = true;
					break;
			}
			patternRows[0].push({ note, instrument, volume, ornament, envelopeShape, effects });
			idx++;
		}
		console.log(patternRows[0].length);
		pattern.rows.push(patternRows[0]);
		return [pattern];
	}
	private convertPattern(pt3Pattern: PT3Pattern, pattern: Pattern): void {
		for (
			let rowIndex = 0;
			rowIndex < Math.min(pt3Pattern.rows.length, pattern.length);
			rowIndex++
		) {
			const vt2Row = pt3Pattern.rows[rowIndex];

			if (rowIndex < pattern.patternRows.length) {
				pattern.patternRows[rowIndex].envelopeValue =
					pt3Pattern.envelopeValues[rowIndex] || 0;
				pattern.patternRows[rowIndex].noiseValue = pt3Pattern.noiseValues[rowIndex] || 0;
			}

			for (let channelIndex = 0; channelIndex < 3; channelIndex++) {
				const vt2ChannelData = vt2Row[channelIndex];
				const row = pattern.channels[channelIndex].rows[rowIndex];

				const { noteName, octave } = this.parseNote(vt2ChannelData.note);
				console.log('a note', vt2ChannelData.note);
				row.note = new Note(noteName, octave);
				row.instrument = vt2ChannelData.instrument;
				row.volume = vt2ChannelData.volume;
				row.ornament = vt2ChannelData.ornament;
				row.envelopeShape = vt2ChannelData.envelopeShape;
				row.effects = this.parseEffects(vt2ChannelData.effects);
			}
		}
	}
	private parseNote(noteStr: string): { noteName: NoteName; octave: number } {
		let octave = parseInt(noteStr.substring(-1));
		return {
			noteName: NoteName.A,
			octave
		};
	}

	private parseEffects(effectsStr: string): (Effect | null)[] {
		return [null];
	}
}

/**
 * Loads and converts a PT3 file to a Song object
 */
export async function loadPT3File(file: File): Promise<Project> {
	const buffer = await file.arrayBuffer();
	const content = new Uint8Array(buffer);
	const converter = new PT3Converter();
	const result = converter.convert(content);
	return result;
}

export { PT3Converter };
