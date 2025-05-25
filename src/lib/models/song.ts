enum NoteName {
	None = 0,
	Off,
	C,
	CSharp,
	D,
	DSharp,
	E,
	F,
	FSharp,
	G,
	GSharp,
	A,
	ASharp,
	B
}

enum EffectType {
	Arpeggio = 0,
	Vibrato = 1,
	Portamento = 2,
	Glissando = 3,
	EnvelopeSlide = 4
	// etc...
}

type ChannelLabel = 'A' | 'B' | 'C';

class Note {
	name: NoteName;
	octave: number;

	constructor(name: NoteName = NoteName.None, octave: number = 0) {
		this.name = name;
		this.octave = octave;
	}
}

class Effect {
	effect: EffectType;
	delay: number;
	parameter: number;

	constructor(effect: EffectType, delay: number = 0, parameter: number = 0) {
		this.effect = effect;
		this.delay = delay;
		this.parameter = parameter;
	}
}

class Row {
	note: Note;
	instrument: number;
	volume: number;
	ornament: number;
	envelopeShape: number;
	effects: (Effect | null)[];

	constructor() {
		this.note = new Note();
		this.instrument = 0;
		this.volume = 0;
		this.ornament = 0;
		this.envelopeShape = 0;
		this.effects = [null];
	}
}

class PatternRow {
	envelopeValue: number;
	envelopeEffect: Effect | null;
	noiseValue: number;

	constructor() {
		this.envelopeValue = 0;
		this.envelopeEffect = null;
		this.noiseValue = 0;
	}
}

class Channel {
	rows: Row[];
	label: ChannelLabel;

	constructor(rowCount: number = 64, label: ChannelLabel) {
		this.rows = Array.from({ length: rowCount }, () => new Row());
		this.label = label;
	}
}

class Pattern {
	id: number;
	length: number;
	channels: [Channel, Channel, Channel];
	patternRows: PatternRow[];

	constructor(id: number, length: number = 64) {
		this.id = id;
		this.length = length;
		this.channels = [
			new Channel(length, 'A'),
			new Channel(length, 'B'),
			new Channel(length, 'C')
		];
		this.patternRows = Array.from({ length }, () => new PatternRow());
	}
}

class Song {
	title: string;
	author: string;
	loopPointId: number;
	patterns: Pattern[];
	patternOrder: number[];

	constructor(title: string = 'New Song', author: string = '') {
		this.title = title;
		this.author = author;
		this.loopPointId = 0;
		this.patterns = [new Pattern(0)];
		this.patternOrder = [0];
	}

	/**
	 * Adds a new pattern to the song
	 */
	addPattern(): Pattern {
		const newId = this.patterns.length;
		const pattern = new Pattern(newId);
		this.patterns.push(pattern);
		return pattern;
	}
}

/**
 * Generates a test song with sample data inspired by tracker music structure
 */
function generateTestSong(): Song {
	const song = new Song('Extended Test Song', 'Test Author');

	// Create multiple patterns for a longer song
	const pattern0 = song.patterns[0];
	const pattern1 = song.addPattern();
	const pattern2 = song.addPattern();
	const pattern3 = song.addPattern();
	const pattern4 = song.addPattern();
	const pattern5 = song.addPattern();

	// Fill patterns with different musical content
	fillPatternWithTestData(pattern0, 0, 'intro');
	fillPatternWithTestData(pattern1, 1, 'verse');
	fillPatternWithTestData(pattern2, 2, 'chorus');
	fillPatternWithTestData(pattern3, 3, 'bridge');
	fillPatternWithTestData(pattern4, 4, 'outro');
	fillPatternWithTestData(pattern5, 5, 'breakdown');

	// Set up a longer pattern order with song structure
	song.patternOrder = [0, 1, 2, 1, 2, 3, 1, 2, 5, 4];
	song.loopPointId = 1; // Loop from verse

	return song;
}

/**
 * Fills a pattern with test data
 */
function fillPatternWithTestData(
	pattern: Pattern,
	patternIndex: number,
	sectionType: string = 'default'
): void {
	// Define different musical scales and patterns for variety
	const scales = {
		major: [NoteName.C, NoteName.D, NoteName.E, NoteName.F, NoteName.G, NoteName.A, NoteName.B],
		minor: [
			NoteName.C,
			NoteName.D,
			NoteName.DSharp,
			NoteName.F,
			NoteName.G,
			NoteName.GSharp,
			NoteName.ASharp
		],
		pentatonic: [NoteName.C, NoteName.D, NoteName.E, NoteName.G, NoteName.A],
		blues: [
			NoteName.C,
			NoteName.DSharp,
			NoteName.F,
			NoteName.FSharp,
			NoteName.G,
			NoteName.ASharp
		]
	};

	// Section-specific configurations
	const sectionConfigs = {
		intro: { scale: scales.major, tempo: 'slow', density: 'sparse', baseOctave: 4 },
		verse: { scale: scales.minor, tempo: 'medium', density: 'medium', baseOctave: 4 },
		chorus: { scale: scales.major, tempo: 'fast', density: 'dense', baseOctave: 5 },
		bridge: { scale: scales.pentatonic, tempo: 'medium', density: 'medium', baseOctave: 3 },
		outro: { scale: scales.blues, tempo: 'slow', density: 'sparse', baseOctave: 4 },
		breakdown: { scale: scales.blues, tempo: 'fast', density: 'dense', baseOctave: 3 }
	};

	const config =
		sectionConfigs[sectionType as keyof typeof sectionConfigs] || sectionConfigs.verse;
	const scale = config.scale;
	const baseOctave = config.baseOctave;

	for (let rowIndex = 0; rowIndex < pattern.length; rowIndex++) {
		// Set envelope and noise values based on section type
		if (rowIndex % 16 === 0) {
			pattern.patternRows[rowIndex].envelopeValue = getEnvelopeForSection(
				sectionType,
				rowIndex
			);
			pattern.patternRows[rowIndex].noiseValue = getNoiseForSection(sectionType, rowIndex);
		}

		// Add envelope effects
		if (rowIndex % 32 === 0 && rowIndex > 0) {
			pattern.patternRows[rowIndex].envelopeEffect = new Effect(
				EffectType.EnvelopeSlide,
				0,
				0x1f + patternIndex * 0x05
			);
		}

		// Fill channels based on section type
		fillChannelForSection(pattern, rowIndex, 0, sectionType, scale, baseOctave, patternIndex); // Lead
		fillChannelForSection(pattern, rowIndex, 1, sectionType, scale, baseOctave, patternIndex); // Harmony
		fillChannelForSection(pattern, rowIndex, 2, sectionType, scale, baseOctave, patternIndex); // Bass
	}
}

function getEnvelopeForSection(sectionType: string, rowIndex: number): number {
	const baseValues = {
		intro: 0x3e,
		verse: 0x2a,
		chorus: 0x4f,
		bridge: 0x1c,
		outro: 0x3e,
		breakdown: 0x5a
	};
	return baseValues[sectionType as keyof typeof baseValues] || 0x3e;
}

function getNoiseForSection(sectionType: string, rowIndex: number): number {
	const baseValues = {
		intro: 0x08,
		verse: 0x06,
		chorus: 0x04,
		bridge: 0x0a,
		outro: 0x08,
		breakdown: 0x02
	};
	return baseValues[sectionType as keyof typeof baseValues] || 0x06;
}

function fillChannelForSection(
	pattern: Pattern,
	rowIndex: number,
	channelIndex: number,
	sectionType: string,
	scale: NoteName[],
	baseOctave: number,
	patternIndex: number
): void {
	const channel = pattern.channels[channelIndex];

	if (channelIndex === 0) {
		// Lead channel
		fillLeadChannel(channel, rowIndex, sectionType, scale, baseOctave, patternIndex);
	} else if (channelIndex === 1) {
		// Harmony channel
		fillHarmonyChannel(channel, rowIndex, sectionType, scale, baseOctave, patternIndex);
	} else if (channelIndex === 2) {
		// Bass channel
		fillBassChannel(channel, rowIndex, sectionType, scale, baseOctave, patternIndex);
	}
}

function fillLeadChannel(
	channel: Channel,
	rowIndex: number,
	sectionType: string,
	scale: NoteName[],
	baseOctave: number,
	patternIndex: number
): void {
	const patterns = {
		intro: [0, 4, 2, 6, 1, 5, 3, 0], // Slow arpeggio
		verse: [0, 2, 4, 2, 1, 3, 5, 3], // Melodic pattern
		chorus: [0, 4, 0, 4, 2, 6, 2, 6], // Energetic pattern
		bridge: [4, 2, 0, 3, 1, 4, 2, 0], // Different melody
		outro: [0, 1, 2, 1, 0, -1, -1, -1], // Fade out
		breakdown: [0, 0, 4, 4, 2, 2, 6, 6] // Rhythmic
	};

	const notePattern = patterns[sectionType as keyof typeof patterns] || patterns.verse;
	const stepSize = sectionType === 'chorus' ? 2 : sectionType === 'intro' ? 8 : 4;

	if (rowIndex % stepSize === 0) {
		const patternStep = Math.floor(rowIndex / stepSize) % notePattern.length;
		const noteIndex = notePattern[patternStep];

		if (noteIndex >= 0 && noteIndex < scale.length) {
			channel.rows[rowIndex].note = new Note(scale[noteIndex], baseOctave);
			channel.rows[rowIndex].instrument = 1 + (patternIndex % 3);
			channel.rows[rowIndex].volume =
				sectionType === 'chorus' ? 0xf : sectionType === 'intro' ? 0xa : 0xd;
			channel.rows[rowIndex].ornament = patternIndex % 4;
			channel.rows[rowIndex].envelopeShape = sectionType === 'breakdown' ? 0x4 : 0x7;
		}
	}

	// Add note offs for breathing
	if (sectionType !== 'breakdown' && rowIndex % 16 === 12) {
		channel.rows[rowIndex].note = new Note(NoteName.Off, 0);
	}

	// Add effects based on section
	if (sectionType === 'chorus' && rowIndex % 8 === 4) {
		channel.rows[rowIndex].effects[0] = new Effect(EffectType.Vibrato, 0, 0x45);
	} else if (sectionType === 'bridge' && rowIndex % 12 === 8) {
		channel.rows[rowIndex].effects[0] = new Effect(EffectType.Portamento, 1, 0x23);
	}
}

function fillHarmonyChannel(
	channel: Channel,
	rowIndex: number,
	sectionType: string,
	scale: NoteName[],
	baseOctave: number,
	patternIndex: number
): void {
	const harmonyOffset = sectionType === 'chorus' ? 2 : 4; // Third or fifth harmony
	const stepSize = sectionType === 'breakdown' ? 4 : 8;

	if (rowIndex % stepSize === 2) {
		const noteIndex = (Math.floor(rowIndex / stepSize) + harmonyOffset) % scale.length;
		const octaveOffset = sectionType === 'bridge' ? 1 : 0;

		channel.rows[rowIndex].note = new Note(scale[noteIndex], baseOctave - 1 + octaveOffset);
		channel.rows[rowIndex].instrument = 2 + (patternIndex % 2);
		channel.rows[rowIndex].volume = sectionType === 'chorus' ? 0xd : 0xa;
		channel.rows[rowIndex].ornament = (patternIndex + 1) % 3;

		// Add harmony effects
		if (sectionType === 'verse' && rowIndex % 16 === 10) {
			channel.rows[rowIndex].effects[0] = new Effect(EffectType.Vibrato, 0, 0x34);
		}
	}
}

function fillBassChannel(
	channel: Channel,
	rowIndex: number,
	sectionType: string,
	scale: NoteName[],
	baseOctave: number,
	patternIndex: number
): void {
	const bassPatterns = {
		intro: [0, -1, 0, -1, 4, -1, 4, -1], // Simple bass
		verse: [0, -1, 4, -1, 0, -1, 3, -1], // Root-fifth pattern
		chorus: [0, 0, 4, 4, 0, 0, 3, 3], // Driving bass
		bridge: [0, 2, 4, 2, 1, 3, 0, 4], // Walking bass
		outro: [0, -1, -1, -1, 4, -1, -1, -1], // Sparse ending
		breakdown: [0, 0, 0, 4, 0, 0, 0, 4] // Rhythmic bass
	};

	const bassPattern =
		bassPatterns[sectionType as keyof typeof bassPatterns] || bassPatterns.verse;
	const stepSize = sectionType === 'breakdown' ? 2 : sectionType === 'chorus' ? 4 : 8;

	if (rowIndex % stepSize === 0) {
		const patternStep = Math.floor(rowIndex / stepSize) % bassPattern.length;
		const noteIndex = bassPattern[patternStep];

		if (noteIndex >= 0 && noteIndex < scale.length) {
			channel.rows[rowIndex].note = new Note(scale[noteIndex], baseOctave - 2);
			channel.rows[rowIndex].instrument = 3 + (patternIndex % 2);
			channel.rows[rowIndex].volume = sectionType === 'breakdown' ? 0xf : 0xc;
			channel.rows[rowIndex].ornament = 2;
			channel.rows[rowIndex].envelopeShape = sectionType === 'chorus' ? 0x6 : 0x4;
		}
	}

	// Add bass effects
	if (sectionType === 'breakdown' && rowIndex % 16 === 8) {
		channel.rows[rowIndex].effects[0] = new Effect(EffectType.Arpeggio, 0, 0x47);
	} else if (sectionType === 'bridge' && rowIndex % 24 === 16) {
		channel.rows[rowIndex].effects[0] = new Effect(EffectType.Glissando, 1, 0x15);
	}
}

export { Song, Pattern, Channel, Row, Note, Effect, NoteName, EffectType, generateTestSong };
