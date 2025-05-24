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
	parameter: number;

	constructor(effect: EffectType, parameter: number = 0) {
		this.effect = effect;
		this.parameter = parameter;
	}
}

class Row {
	note: Note;
	instrument: number;
	volume: number;
	ornament: number;
	envelopeShape: number;
	effects: Effect[];

	constructor() {
		this.note = new Note();
		this.instrument = 0;
		this.volume = 0;
		this.ornament = 0;
		this.envelopeShape = 0;
		this.effects = [];
	}
}

class PatternRow {
	envelopeValue: number;
	noiseValue: number;

	constructor() {
		this.envelopeValue = 0;
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

export { Song, Pattern, Channel, Row, Note, Effect, NoteName, EffectType };
