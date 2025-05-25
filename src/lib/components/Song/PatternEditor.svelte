<script lang="ts">
	import type { Effect, Pattern } from '../../models/song';
	import { NoteName, EffectType } from '../../models/song';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	let cursorPositionY = $state(0);
	let cursorPositionX = $state(0);
	let canvasWidth = $state(800);

	let {
		currentPatternIndex = $bindable(),
		patterns = $bindable()
	}: {
		currentPatternIndex: number;
		patterns: Pattern[];
	} = $props();

	const ROW_HEIGHT = 24;
	const FONT_SIZE = 14;
	const FONT_FAMILY = 'monospace';
	const TEXT_COLOR = '#ffffff';
	const BACKGROUND_COLOR = '#111111';
	const HEADER_COLOR = '#cccccc';
	const SEPARATOR_COLOR = '#444444';

	const CELL_WIDTH = 12;
	const ROW_NUM_WIDTH = 30;
	const NOTE_CELL_WIDTH = 30;

	const SMALL_PADDING = 8;
	const MEDIUM_PADDING = 10;
	const LARGE_PADDING = 15;
	const XLARGE_PADDING = 20;
	const HEADER_ROW_OFFSET = 2;

	type CellType = 'hex4' | 'hex2' | 'note' | 'instrument' | 'effect';

	interface Cell {
		type: CellType;
		value: number | string;
		x: number;
		width: number;
	}

	function formatHexCells(value: number, digits: number): string[] {
		if (value === 0) return Array(digits).fill('.');
		const hexStr = value.toString(16).toUpperCase();
		const padded = hexStr.padStart(digits, '.');
		return padded.split('').map((char) => (char === '0' ? '.' : char));
	}

	function formatHex4Cells(value: number): string[] {
		return formatHexCells(value, 4);
	}

	function formatHex2Cells(value: number): string[] {
		return formatHexCells(value, 2);
	}

	function formatNote(noteName: NoteName, octave: number): string {
		const noteNames = [
			'---',
			'R--',
			'C-',
			'C#',
			'D-',
			'D#',
			'E-',
			'F-',
			'F#',
			'G-',
			'G#',
			'A-',
			'A#',
			'B-'
		];
		if (noteName === NoteName.None) return '---';
		if (noteName === NoteName.Off) return 'R--';
		return noteNames[noteName] + octave.toString();
	}

	function formatInstrumentOrOrnament(value: number): string {
		if (value === 0) return '.';
		if (value <= 9) return value.toString();
		// Convert to alphabetic: 10=A, 11=B, ..., 35=Z
		return String.fromCharCode(65 + value - 10);
	}

	function formatVolume(value: number): string {
		if (value === 0) return '.';
		return value.toString(16).toUpperCase();
	}

	function formatEffectCells(effect: Effect | null): string[] {
		if (!effect) return ['.', '.', '.', '.'];

		const effectType = effect.effect === 0 ? '.' : effect.effect.toString(16).toUpperCase();
		const delay = effect.delay;
		const parameter = effect.parameter;

		const delayStr = delay === 0 ? '.' : delay.toString(16).toUpperCase();
		const paramCells = formatHex2Cells(parameter);

		return [effectType, delayStr, paramCells[0], paramCells[1]];
	}

	function getChannelWidth(): number {
		return (
			NOTE_CELL_WIDTH +
			SMALL_PADDING +
			CELL_WIDTH +
			SMALL_PADDING +
			CELL_WIDTH +
			SMALL_PADDING +
			CELL_WIDTH +
			SMALL_PADDING +
			CELL_WIDTH +
			SMALL_PADDING +
			4 * CELL_WIDTH
		);
	}

	function calculateCanvasWidth(): number {
		let x = ROW_NUM_WIDTH + SMALL_PADDING;
		x += 4 * CELL_WIDTH + SMALL_PADDING;
		x += 4 * CELL_WIDTH + MEDIUM_PADDING;
		x += 2 * CELL_WIDTH + LARGE_PADDING;

		for (let channelIndex = 0; channelIndex < 3; channelIndex++) {
			x += getChannelWidth();

			if (channelIndex < 2) {
				x += XLARGE_PADDING;
			}
		}

		x += SMALL_PADDING;

		return x;
	}

	function addCellGroup(
		cells: Cell[],
		values: string[],
		type: CellType,
		x: number,
		cellWidth: number = CELL_WIDTH
	): number {
		for (let i = 0; i < values.length; i++) {
			cells.push({
				type,
				value: values[i],
				x: x + i * cellWidth,
				width: cellWidth
			});
		}
		return x + values.length * cellWidth;
	}

	function getCellsForRow(pattern: Pattern, rowIndex: number): Cell[] {
		const cells: Cell[] = [];
		let x = ROW_NUM_WIDTH + SMALL_PADDING;

		const patternRow = pattern.patternRows[rowIndex];

		const envelopeCells = formatHex4Cells(patternRow.envelopeValue);
		x = addCellGroup(cells, envelopeCells, 'hex4', x);
		x += SMALL_PADDING;

		const envelopeEffectCells = formatEffectCells(patternRow.envelopeEffect);
		x = addCellGroup(cells, envelopeEffectCells, 'effect', x);
		x += MEDIUM_PADDING;

		const noiseCells = formatHex2Cells(patternRow.noiseValue);
		x = addCellGroup(cells, noiseCells, 'hex2', x);
		x += LARGE_PADDING;

		for (let channelIndex = 0; channelIndex < 3; channelIndex++) {
			const channel = pattern.channels[channelIndex];
			const row = channel.rows[rowIndex];

			cells.push({
				type: 'note',
				value: formatNote(row.note.name, row.note.octave),
				x: x,
				width: NOTE_CELL_WIDTH
			});
			x += NOTE_CELL_WIDTH + SMALL_PADDING;

			cells.push({
				type: 'instrument',
				value: formatInstrumentOrOrnament(row.instrument),
				x: x,
				width: CELL_WIDTH
			});
			x += CELL_WIDTH + SMALL_PADDING;

			cells.push({
				type: 'hex2',
				value: row.envelopeShape === 0 ? '.' : row.envelopeShape.toString(16).toUpperCase(),
				x: x,
				width: CELL_WIDTH
			});
			x += CELL_WIDTH + SMALL_PADDING;

			cells.push({
				type: 'instrument',
				value: formatInstrumentOrOrnament(row.ornament),
				x: x,
				width: CELL_WIDTH
			});
			x += CELL_WIDTH + SMALL_PADDING;

			cells.push({
				type: 'hex2',
				value: formatVolume(row.volume),
				x: x,
				width: CELL_WIDTH
			});
			x += CELL_WIDTH + SMALL_PADDING;

			const effectCells = formatEffectCells(row.effects[0]);
			x = addCellGroup(cells, effectCells, 'effect', x);

			if (channelIndex < 2) {
				x += XLARGE_PADDING;
			}
		}

		return cells;
	}

	function draw() {
		if (!ctx || !patterns || patterns.length === 0) return;

		const currentPattern = patterns[currentPatternIndex];
		if (!currentPattern) return;

		canvasWidth = calculateCanvasWidth();

		ctx.fillStyle = BACKGROUND_COLOR;
		ctx.fillRect(0, 0, canvasWidth, 1000);

		ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'left';

		drawHeader();

		for (let rowIndex = 0; rowIndex < currentPattern.length; rowIndex++) {
			const y = (rowIndex + HEADER_ROW_OFFSET) * ROW_HEIGHT;
			drawRow(currentPattern, rowIndex, y);
		}
	}

	function drawHeader() {
		ctx.fillStyle = HEADER_COLOR;
		let x = SMALL_PADDING;
		x = ROW_NUM_WIDTH + SMALL_PADDING;
		x += 4 * CELL_WIDTH + SMALL_PADDING;
		x += 4 * CELL_WIDTH + MEDIUM_PADDING;
		x += 2 * CELL_WIDTH + LARGE_PADDING;

		const channels = ['Channel A', 'Channel B', 'Channel C'];
		for (const channelName of channels) {
			ctx.fillText(channelName, Math.round(x), Math.round(ROW_HEIGHT / 2));
			x += getChannelWidth() + XLARGE_PADDING;
		}

		ctx.strokeStyle = SEPARATOR_COLOR;
		ctx.beginPath();
		ctx.moveTo(0, ROW_HEIGHT);
		ctx.lineTo(canvasWidth, ROW_HEIGHT);
		ctx.stroke();

		drawVerticalSeparators();
	}

	function drawSeparatorInGap(x: number, gap: number): number {
		const separatorX = x + gap / 2;
		drawVerticalLine(separatorX);
		return x + gap;
	}

	function drawVerticalSeparators() {
		ctx.strokeStyle = SEPARATOR_COLOR;
		ctx.lineWidth = 1;

		let x = ROW_NUM_WIDTH + SMALL_PADDING;
		x += 4 * CELL_WIDTH;
		x = drawSeparatorInGap(x, SMALL_PADDING);
		x += 4 * CELL_WIDTH;
		x = drawSeparatorInGap(x, MEDIUM_PADDING);
		x += 2 * CELL_WIDTH;
		x = drawSeparatorInGap(x, LARGE_PADDING);

		for (let channelIndex = 0; channelIndex < 2; channelIndex++) {
			x += getChannelWidth();
			x = drawSeparatorInGap(x, XLARGE_PADDING);
		}
	}

	function drawVerticalLine(x: number) {
		const currentPattern = patterns[currentPatternIndex];
		if (!currentPattern) return;

		const canvasHeight = (currentPattern.length + HEADER_ROW_OFFSET) * ROW_HEIGHT;

		ctx.beginPath();
		ctx.moveTo(Math.round(x), ROW_HEIGHT);
		ctx.lineTo(Math.round(x), canvasHeight);
		ctx.stroke();
	}

	function drawRow(pattern: Pattern, rowIndex: number, y: number) {
		ctx.fillStyle = TEXT_COLOR;

		ctx.fillText(
			rowIndex.toString(16).toUpperCase().padStart(2, '0'),
			Math.round(SMALL_PADDING),
			Math.round(y + ROW_HEIGHT / 2)
		);

		const cells = getCellsForRow(pattern, rowIndex);

		for (const cell of cells) {
			ctx.fillText(cell.value.toString(), Math.round(cell.x), Math.round(y + ROW_HEIGHT / 2));
		}
	}

	function setupCanvas() {
		if (!canvas) return;

		const dpr = window.devicePixelRatio || 1;

		canvas.width = canvasWidth * dpr;
		canvas.height = 1000 * dpr;

		canvas.style.width = canvasWidth + 'px';
		canvas.style.height = '1000px';

		ctx = canvas.getContext('2d')!;
		ctx.scale(dpr, dpr);

		ctx.imageSmoothingEnabled = false;
	}

	$effect(() => {
		if (canvas && patterns && currentPatternIndex !== undefined) {
			setupCanvas();
			draw();
		}
	});
</script>

<canvas bind:this={canvas} height="1000" width={canvasWidth}></canvas>
