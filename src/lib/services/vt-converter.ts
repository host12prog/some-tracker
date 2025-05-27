import { Project } from '../models/project';
import { Song, Pattern, Channel, Row, Note, Effect, NoteName, EffectType } from '../models/song';

interface VT2Module {
	title: string;
	author: string;
	version: string;
	speed: number;
	playOrder: number[];
	loopPoint?: number;
}

interface VT2Ornament {
	id: number;
	data: number[];
	loop: boolean;
	loopPoint: number;
}

interface VT2Sample {
	id: number;
	data: VT2SampleLine[];
}

interface VT2SampleLine {
	tone: boolean;
	noise: boolean;
	envelope: boolean;
	toneAdd: number;
	noiseAdd: number;
	volume: number;
	loop: boolean;
}

interface VT2PatternRow {
	note: string;
	instrument: number;
	volume: number;
	ornament: number;
	envelopeShape: number;
	effects: string;
}

interface VT2Pattern {
	id: number;
	rows: VT2PatternRow[][];
	envelopeValues: number[];
	noiseValues: number[];
}

class VT2Converter {
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

	private readonly effectTypeMap: Record<string, EffectType> = {
		'1': EffectType.Glissando,
		'2': EffectType.Portamento,
		'3': EffectType.Portamento,
		'4': EffectType.Vibrato,
		'5': EffectType.EnvelopeSlide,
		A: EffectType.Arpeggio,
		B: EffectType.Arpeggio,
		C: EffectType.Arpeggio,
		V: EffectType.Vibrato,
		E: EffectType.EnvelopeSlide,
		P: EffectType.Portamento,
		K: EffectType.Arpeggio,
		S: EffectType.EnvelopeSlide
	} as const;

	/**
	 * Converts a VT2 file content to a Song object
	 */
	convert(vt2Content: string): Project {
		const lines = vt2Content.split('\n').map((line) => line.trim());

		const module = this.parseModule(lines);
		const ornaments = this.parseOrnaments(lines);
		const samples = this.parseSamples(lines);
		const patterns = this.parsePatterns(lines);

		const song = new Song();
		song.patterns = patterns.map((vt2Pattern) => {
			const pattern = new Pattern(vt2Pattern.id, vt2Pattern.rows.length);
			this.convertPattern(vt2Pattern, pattern);
			return pattern;
		});

		song.patternOrder = module.playOrder;
		song.loopPointId = module.loopPoint || 0;

		// Detect chip type from title or author
		const titleLower = module.title.toLowerCase();
		const authorLower = module.author.toLowerCase();

		let chipType: 'AY' | 'YM' = 'AY'; // Default to AY
		if (titleLower.includes('ym') || authorLower.includes('ym')) {
			chipType = 'YM';
		} else if (titleLower.includes('ay') || authorLower.includes('ay')) {
			chipType = 'AY';
		}

		return new Project(module.title, module.author, [song], chipType);
	}

	private parseModule(lines: string[]): VT2Module {
		const module: VT2Module = {
			title: '',
			author: '',
			version: '',
			speed: 3,
			playOrder: [],
			loopPoint: 0
		};

		const moduleLines = this.extractSection(lines, '[Module]');

		for (const line of moduleLines) {
			const [key, value] = line.split('=', 2);
			if (!key || value === undefined) continue;

			switch (key) {
				case 'Title':
					module.title = value;
					break;
				case 'Author':
					module.author = value;
					break;
				case 'Version':
					module.version = value;
					break;
				case 'Speed':
					module.speed = parseInt(value) || 6;
					break;
				case 'PlayOrder':
					module.playOrder = this.parsePlayOrder(value);
					break;
			}
		}

		return module;
	}

	private parsePlayOrder(orderString: string): number[] {
		return orderString
			.split(',')
			.map((part) => part.trim())
			.map((part) => parseInt(part.startsWith('L') ? part.substring(1) : part))
			.filter((num) => !isNaN(num));
	}

	private parseOrnaments(lines: string[]): VT2Ornament[] {
		const ornaments: VT2Ornament[] = [];
		const ornamentSections = this.extractSections(lines, /^\[Ornament(\d+)\]$/);

		for (const { match, content } of ornamentSections) {
			const id = parseInt(match[1]);
			const ornament: VT2Ornament = {
				id,
				data: [],
				loop: false,
				loopPoint: 0
			};

			for (const line of content) {
				const values = line.split(',').map((v) => v.trim());
				for (const value of values) {
					if (value.startsWith('L')) {
						ornament.loop = true;
						ornament.loopPoint = ornament.data.length;
						const num = parseInt(value.substring(1));
						if (!isNaN(num)) ornament.data.push(num);
					} else {
						const num = parseInt(value);
						if (!isNaN(num)) ornament.data.push(num);
					}
				}
			}

			ornaments.push(ornament);
		}

		return ornaments;
	}

	private parseSamples(lines: string[]): VT2Sample[] {
		const samples: VT2Sample[] = [];
		const sampleSections = this.extractSections(lines, /^\[Sample(\d+)\]$/);

		for (const { match, content } of sampleSections) {
			const id = parseInt(match[1]);
			const sample: VT2Sample = {
				id,
				data: content
					.map((line) => this.parseSampleLine(line))
					.filter(Boolean) as VT2SampleLine[]
			};
			samples.push(sample);
		}

		return samples;
	}

	private parseSampleLine(line: string): VT2SampleLine | null {
		const parts = line.split(/\s+/);
		if (parts.length < 4) return null;

		const [flags, toneStr, noiseStr, volumeStr, ...rest] = parts;

		return {
			tone: flags.includes('T'),
			noise: flags.includes('N'),
			envelope: flags.includes('E'),
			toneAdd: this.parseSignedHex(toneStr),
			noiseAdd: this.parseSignedHex(noiseStr),
			volume: parseInt(volumeStr.replace('_', ''), 16) || 0,
			loop: rest.includes('L')
		};
	}

	private parseSignedHex(str: string): number {
		const cleaned = str.replace(/[+_^-]/g, '');
		let value = parseInt(cleaned, 16) || 0;
		return str.includes('-') ? -value : value;
	}

	private parsePatterns(lines: string[]): VT2Pattern[] {
		const patterns: VT2Pattern[] = [];
		const patternSections = this.extractSections(lines, /^\[Pattern(\d+)\]$/);

		for (const { match, content } of patternSections) {
			const id = parseInt(match[1]);
			const pattern: VT2Pattern = {
				id,
				rows: [],
				envelopeValues: [],
				noiseValues: []
			};

			for (const line of content) {
				const { channelRows, envelopeValue, noiseValue } = this.parsePatternRow(line);
				if (channelRows) {
					pattern.rows.push(channelRows);
					pattern.envelopeValues.push(envelopeValue);
					pattern.noiseValues.push(noiseValue);
				}
			}

			patterns.push(pattern);
		}

		return patterns;
	}

	private parsePatternRow(line: string) {
		const channels = line.split('|');
		if (channels.length < 4) {
			return { channelRows: null, envelopeValue: 0, noiseValue: 0 };
		}

		const [envelopePart, noisePart, ...channelParts] = channels;

		const envelopeValue = this.parseHexValue(envelopePart, 4);
		const noiseValue = this.parseHexValue(noisePart, 2);

		const channelRows = channelParts
			.slice(0, 3)
			.map((channelData) => this.parseChannelData(channelData.trim()));

		return { channelRows, envelopeValue, noiseValue };
	}

	private parseHexValue(str: string, length: number): number {
		if (str.length < length) return 0;
		const hex = str.substring(0, length).replace(/\./g, '0');
		return parseInt(hex, 16) || 0;
	}

	private parseChannelData(data: string): VT2PatternRow {
		const parts = data.split(/\s+/);
		const [note = '', sampleAndVol = '', ...effectParts] = parts;
		const effects = effectParts.join(' ');

		let instrument = 0;
		let volume = 0;
		let ornament = 0;
		let envelopeShape = 0;

		if (sampleAndVol.length >= 4) {
			instrument = this.parseHexDigit(sampleAndVol[0]);
			envelopeShape = this.parseHexDigit(sampleAndVol[1]);
			ornament = this.parseHexDigit(sampleAndVol[2]);
			volume = this.parseHexDigit(sampleAndVol[3]);
		}

		return {
			note,
			instrument,
			volume,
			ornament,
			envelopeShape,
			effects
		};
	}

	private convertPattern(vt2Pattern: VT2Pattern, pattern: Pattern): void {
		for (
			let rowIndex = 0;
			rowIndex < Math.min(vt2Pattern.rows.length, pattern.length);
			rowIndex++
		) {
			const vt2Row = vt2Pattern.rows[rowIndex];

			if (rowIndex < pattern.patternRows.length) {
				pattern.patternRows[rowIndex].envelopeValue =
					vt2Pattern.envelopeValues[rowIndex] || 0;
				pattern.patternRows[rowIndex].noiseValue = vt2Pattern.noiseValues[rowIndex] || 0;
			}

			for (let channelIndex = 0; channelIndex < 3; channelIndex++) {
				const vt2ChannelData = vt2Row[channelIndex];
				const row = pattern.channels[channelIndex].rows[rowIndex];

				const { noteName, octave } = this.parseNote(vt2ChannelData.note);
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
		if (!noteStr || ['---', 'R--', '...'].includes(noteStr)) {
			return { noteName: NoteName.None, octave: 0 };
		}

		let notePart = '';
		let octave = 0;

		if (noteStr.length >= 3) {
			if (noteStr[1] === '#') {
				notePart = noteStr.substring(0, 2);
				octave = parseInt(noteStr.substring(2)) || 0;
			} else if (noteStr[1] === '-') {
				notePart = noteStr[0];
				octave = parseInt(noteStr.substring(2)) || 0;
			} else {
				notePart = noteStr[0];
				octave = parseInt(noteStr.substring(1)) || 0;
			}
		} else if (noteStr.length === 2) {
			notePart = noteStr[0];
			octave = parseInt(noteStr.substring(1)) || 0;
		} else {
			notePart = noteStr;
			octave = 4;
		}

		return {
			noteName: this.noteNameMap[notePart] || NoteName.None,
			octave
		};
	}

	private parseEffects(effectsStr: string): (Effect | null)[] {
		const trimmed = effectsStr.trim();

		if (!trimmed || trimmed.length !== 4) {
			return [null];
		}

		const [effectTypeChar, delayChar, param1Char, param2Char] = trimmed;

		if (effectTypeChar === '.') {
			return [null];
		}

		const effectType = this.effectTypeMap[effectTypeChar];
		if (!effectType) {
			return [null];
		}

		const delay = delayChar !== '.' ? this.parseHexDigit(delayChar) : 0;
		const param1 = param1Char !== '.' ? this.parseHexDigit(param1Char) : 0;
		const param2 = param2Char !== '.' ? this.parseHexDigit(param2Char) : 0;
		const parameter = (param1 << 4) | param2;

		return [new Effect(effectType, delay, parameter)];
	}

	private parseHexDigit(char: string): number {
		if (char === '.') return 0;
		if (char >= '0' && char <= '9') return parseInt(char);
		if (char >= 'A' && char <= 'F') return char.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
		if (char >= 'a' && char <= 'f') return char.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
		return 0;
	}

	private extractSection(lines: string[], sectionName: string): string[] {
		const content: string[] = [];
		let inSection = false;

		for (const line of lines) {
			if (line === sectionName) {
				inSection = true;
				continue;
			}
			if (line.startsWith('[') && line !== sectionName) {
				inSection = false;
				continue;
			}
			if (inSection && line) {
				content.push(line);
			}
		}

		return content;
	}

	private extractSections(
		lines: string[],
		pattern: RegExp
	): Array<{ match: RegExpMatchArray; content: string[] }> {
		const sections: Array<{ match: RegExpMatchArray; content: string[] }> = [];
		let currentMatch: RegExpMatchArray | null = null;
		let currentContent: string[] = [];

		for (const line of lines) {
			const match = line.match(pattern);
			if (match) {
				if (currentMatch) {
					sections.push({ match: currentMatch, content: currentContent });
				}
				currentMatch = match;
				currentContent = [];
				continue;
			}

			if (currentMatch && line && !line.startsWith('[')) {
				currentContent.push(line);
			}
		}

		if (currentMatch) {
			sections.push({ match: currentMatch, content: currentContent });
		}

		return sections;
	}
}

/**
 * Loads and converts a VT2 file to a Song object
 */
export async function loadVT2File(file: File): Promise<Project> {
	const content = await file.text();
	const converter = new VT2Converter();
	return converter.convert(content);
}

/**
 * Converts VT2 file content (as string) to a Song object
 */
export function convertVT2String(content: string): Project {
	const converter = new VT2Converter();
	return converter.convert(content);
}

export { VT2Converter };
