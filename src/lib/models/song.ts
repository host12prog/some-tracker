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
	const song = new Song('Test Song', 'Test Author');

	// Create a few patterns with sample data
	const pattern0 = song.patterns[0];
	const pattern1 = song.addPattern();

	// Fill pattern 0 with some test data
	fillPatternWithTestData(pattern0, 0);
	fillPatternWithTestData(pattern1, 1);

	// Set up pattern order
	song.patternOrder = [0, 1, 0, 1];
	song.loopPointId = 0;

	return song;
}

/**
 * Fills a pattern with test data
 */
function fillPatternWithTestData(pattern: Pattern, patternIndex: number): void {
	const baseNotes = [
		NoteName.C,
		NoteName.D,
		NoteName.E,
		NoteName.F,
		NoteName.G,
		NoteName.A,
		NoteName.B
	];
	const baseOctave = 4;

	for (let rowIndex = 0; rowIndex < pattern.length; rowIndex++) {
		// Set envelope and noise values for some rows
		if (rowIndex % 16 === 0) {
			pattern.patternRows[rowIndex].envelopeValue = 0x3e + patternIndex * 0x10;
			pattern.patternRows[rowIndex].noiseValue = 0x06 + patternIndex * 0x02;
		}

		// Add envelope effects occasionally
		if (rowIndex % 32 === 0 && rowIndex > 0) {
			pattern.patternRows[rowIndex].envelopeEffect = new Effect(
				EffectType.EnvelopeSlide,
				0,
				0x1f
			);
		}

		// Fill channel A with a melody
		if (rowIndex % 4 === 0) {
			const noteIndex = Math.floor(rowIndex / 4) % baseNotes.length;
			pattern.channels[0].rows[rowIndex].note = new Note(
				baseNotes[noteIndex],
				baseOctave + (patternIndex % 2)
			);
			pattern.channels[0].rows[rowIndex].instrument = 1 + patternIndex;
			pattern.channels[0].rows[rowIndex].volume = 0xf;
			pattern.channels[0].rows[rowIndex].ornament = patternIndex % 3;
			pattern.channels[0].rows[rowIndex].envelopeShape = 0x7;
		}

		// Fill channel B with harmony (every 8 rows)
		if (rowIndex % 8 === 2) {
			const noteIndex = (Math.floor(rowIndex / 8) + 2) % baseNotes.length;
			pattern.channels[1].rows[rowIndex].note = new Note(
				baseNotes[noteIndex],
				baseOctave - 1 + (patternIndex % 2)
			);
			pattern.channels[1].rows[rowIndex].instrument = 2;
			pattern.channels[1].rows[rowIndex].volume = 0xc;
			pattern.channels[1].rows[rowIndex].ornament = 1;

			// Add some effects
			if (rowIndex % 16 === 2) {
				pattern.channels[1].rows[rowIndex].effects[0] = new Effect(
					EffectType.Vibrato,
					0,
					0x34
				);
			}
		}

		// Fill channel C with bass (every 16 rows)
		if (rowIndex % 16 === 0) {
			const noteIndex = Math.floor(rowIndex / 16) % 4; // Use only lower notes
			pattern.channels[2].rows[rowIndex].note = new Note(
				baseNotes[noteIndex],
				baseOctave - 2
			);
			pattern.channels[2].rows[rowIndex].instrument = 3;
			pattern.channels[2].rows[rowIndex].volume = 0xe;
			pattern.channels[2].rows[rowIndex].ornament = 2;
			pattern.channels[2].rows[rowIndex].envelopeShape = 0x4;
		}

		// Add some note offs
		if (rowIndex % 12 === 8) {
			pattern.channels[0].rows[rowIndex].note = new Note(NoteName.Off, 0);
		}

		// Add some portamento effects
		if (rowIndex % 24 === 16) {
			pattern.channels[0].rows[rowIndex].effects[0] = new Effect(
				EffectType.Portamento,
				2,
				0x12
			);
		}

		// Add arpeggio effects
		if (rowIndex % 32 === 24) {
			pattern.channels[2].rows[rowIndex].effects[0] = new Effect(
				EffectType.Arpeggio,
				0,
				0x47
			);
		}
	}
}

export { Song, Pattern, Channel, Row, Note, Effect, NoteName, EffectType, generateTestSong };
