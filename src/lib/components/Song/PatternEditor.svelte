<script lang="ts">
	import type { Effect, Pattern } from '../../models/song';
	import { NoteName } from '../../models/song';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	let canvasWidth = $state(0);
	let canvasHeight = $state(0);
	let viewportHeight = $state(0);

	let {
		currentPatternOrderIndex = $bindable(),
		patterns = $bindable(),
		selectedRow = $bindable(),
		patternOrder = $bindable()
	}: {
		currentPatternOrderIndex: number;
		patterns: Pattern[];
		selectedRow: number;
		patternOrder: number[];
	} = $props();

	let currentPatternIndex = $derived(patternOrder[currentPatternOrderIndex]);

	const FONT_SIZE = 14;
	const FONT_FAMILY = 'monospace';
	const TEXT_COLOR = '#e2e8f0';
	const EMPTY_TEXT_COLOR = '#475569';
	const NOTE_COLOR = '#60a5fa';
	const INSTRUMENT_COLOR = '#34d399';
	const EFFECT_COLOR = '#f472b6';
	const ENVELOPE_COLOR = '#fbbf24';
	const NOISE_COLOR = '#a78bfa';
	const BACKGROUND_COLOR = '#0f172a';
	const HEADER_COLOR = '#94a3b8';
	const SEPARATOR_COLOR = '#334155';
	const SELECTED_ROW_COLOR = '#1e40af20';
	const ROW_NUMBER_COLOR = '#64748b';
	const ALTERNATE_ROW_COLOR = '#0f172a80';
	const GHOST_PATTERN_ALPHA = 0.25;
	const HEADER_ROW_OFFSET = 1.1;

	let fontMetrics = {
		charWidth: 0,
		lineHeight: 0,
		cellGap: 0,
		sectionGap: 0
	};

	function measureFont() {
		if (!ctx) return;

		ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;

		const charWidth = ctx.measureText('0').width;

		const lineHeight = FONT_SIZE * 1.8;
		const cellGap = Math.max(5, Math.round(FONT_SIZE * 1.2));
		const sectionGap = Math.max(10, Math.round(FONT_SIZE * 1.2));

		fontMetrics = { charWidth, lineHeight, cellGap, sectionGap };
	}

	function getElementContent(elementIndex: number, pattern: Pattern, rowIndex: number): string {
		const patternRow = pattern.patternRows[rowIndex];

		if (elementIndex === 0) return rowIndex.toString(16).toUpperCase().padStart(2, '0');
		if (elementIndex === 1) return formatHex4Cells(patternRow.envelopeValue).join('');
		if (elementIndex === 2) return formatEffectCells(patternRow.envelopeEffect).join('');
		if (elementIndex === 3) return formatHex2Cells(patternRow.noiseValue).join('');

		const channelElementIndex = elementIndex - 4;
		const channelIndex = Math.floor(channelElementIndex / 6);
		const elementInChannel = channelElementIndex % 6;

		if (channelIndex >= 3) return '';

		const channel = pattern.channels[channelIndex];
		const row = channel.rows[rowIndex];

		switch (elementInChannel) {
			case 0:
				return formatNote(row.note.name, row.note.octave);
			case 1:
				return formatInstrumentOrOrnament(row.instrument);
			case 2:
				return row.envelopeShape === 0 ? '.' : row.envelopeShape.toString(16).toUpperCase();
			case 3:
				return formatInstrumentOrOrnament(row.ornament);
			case 4:
				return formatVolume(row.volume);
			case 5:
				return formatEffectCells(row.effects[0]).join('');
			default:
				return '';
		}
	}

	function getElementPosition(elementIndex: number, pattern: Pattern, rowIndex: number): number {
		const { charWidth } = fontMetrics;
		let x = charWidth;

		for (let i = 0; i < elementIndex; i++) {
			const content = getElementContent(i, pattern, rowIndex);
			const width = ctx.measureText(content).width;
			x += width + charWidth;
		}

		return x;
	}

	type CellType =
		| 'hex4'
		| 'hex2'
		| 'note'
		| 'instrument'
		| 'effect'
		| 'envelope'
		| 'envelope_effect'
		| 'noise';

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

	function calculateCanvasWidth(): number {
		if (!patterns || patterns.length === 0) return 800;

		const { charWidth } = fontMetrics;
		const currentPattern = patterns[currentPatternIndex];
		if (!currentPattern) return 800;

		let maxWidth = 0;
		for (let rowIndex = 0; rowIndex < currentPattern.length; rowIndex++) {
			const lastElementIndex = 21;
			const lastElementPosition = getElementPosition(
				lastElementIndex,
				currentPattern,
				rowIndex
			);
			const lastElementContent = getElementContent(
				lastElementIndex,
				currentPattern,
				rowIndex
			);
			const lastElementWidth = ctx.measureText(lastElementContent).width;
			const rowWidth = lastElementPosition + lastElementWidth + charWidth;
			maxWidth = Math.max(maxWidth, rowWidth);
		}

		return maxWidth;
	}

	function calculateVisibleRowCounts() {
		const headerHeight = HEADER_ROW_OFFSET * fontMetrics.lineHeight;
		const availableHeight = viewportHeight - headerHeight;
		const totalVisibleRows = Math.floor(availableHeight / fontMetrics.lineHeight);

		const adjustedTotalRows =
			totalVisibleRows % 2 === 0 ? totalVisibleRows - 1 : totalVisibleRows;
		const visibleRowsAbove = Math.floor(adjustedTotalRows / 2);
		const visibleRowsBelow = Math.floor(adjustedTotalRows / 2);

		canvasHeight = headerHeight + adjustedTotalRows * fontMetrics.lineHeight;

		return { visibleRowsAbove, visibleRowsBelow, totalVisibleRows: adjustedTotalRows };
	}

	function getVisibleRows() {
		const currentPattern = patterns[currentPatternIndex];
		if (!currentPattern) return { visibleRows: [], ghostRows: [] };

		const { visibleRowsAbove, visibleRowsBelow } = calculateVisibleRowCounts();

		const visibleRows = [];
		const ghostRows = [];

		const startRow = selectedRow - visibleRowsAbove;
		const endRow = selectedRow + visibleRowsBelow;

		for (let i = startRow; i <= endRow; i++) {
			const displayIndex = i - startRow;

			if (i >= 0 && i < currentPattern.length) {
				visibleRows.push({
					patternIndex: currentPatternIndex,
					rowIndex: i,
					displayIndex,
					isSelected: i === selectedRow,
					isGhost: false
				});
			} else if (i < 0) {
				const prevPatternOrderIndex = currentPatternOrderIndex - 1;
				if (prevPatternOrderIndex >= 0 && prevPatternOrderIndex < patternOrder.length) {
					const prevPatternIndex = patternOrder[prevPatternOrderIndex];
					const prevPattern = patterns[prevPatternIndex];
					if (prevPattern) {
						const ghostRowIndex = prevPattern.length + i;
						if (ghostRowIndex >= 0) {
							ghostRows.push({
								patternIndex: prevPatternIndex,
								rowIndex: ghostRowIndex,
								displayIndex,
								isSelected: false,
								isGhost: true
							});
						}
					}
				}
			} else {
				const nextPatternOrderIndex = currentPatternOrderIndex + 1;
				if (nextPatternOrderIndex < patternOrder.length) {
					const nextPatternIndex = patternOrder[nextPatternOrderIndex];
					const nextPattern = patterns[nextPatternIndex];
					if (nextPattern) {
						const ghostRowIndex = i - currentPattern.length;
						ghostRows.push({
							patternIndex: nextPatternIndex,
							rowIndex: ghostRowIndex,
							displayIndex,
							isSelected: false,
							isGhost: true
						});
					}
				}
			}
		}

		return { visibleRows, ghostRows };
	}

	function addCell(cells: Cell[], value: string, type: CellType, x: number, width: number): void {
		cells.push({ type, value, x, width });
	}

	function getCellsForRow(pattern: Pattern, rowIndex: number): Cell[] {
		const cells: Cell[] = [];

		for (let elementIndex = 1; elementIndex < 22; elementIndex++) {
			const content = getElementContent(elementIndex, pattern, rowIndex);
			const x = getElementPosition(elementIndex, pattern, rowIndex);
			const width = ctx.measureText(content).width;

			let type: CellType = 'hex2';
			if (elementIndex === 1) type = 'envelope';
			else if (elementIndex === 2) type = 'envelope_effect';
			else if (elementIndex === 3) type = 'noise';
			else {
				const channelElementIndex = elementIndex - 4;
				const elementInChannel = channelElementIndex % 6;
				if (elementInChannel === 0) type = 'note';
				else if (elementInChannel === 1 || elementInChannel === 3) type = 'instrument';
				else if (elementInChannel === 5) type = 'effect';
				else type = 'hex2';
			}

			addCell(cells, content, type, x, width);
		}

		return cells;
	}

	function draw() {
		if (!ctx || !patterns || patterns.length === 0) return;

		const currentPattern = patterns[currentPatternIndex];
		if (!currentPattern) return;

		measureFont();

		canvasWidth = calculateCanvasWidth();

		const { visibleRows, ghostRows } = getVisibleRows();

		ctx.fillStyle = BACKGROUND_COLOR;
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'left';

		drawHeader();

		ctx.globalAlpha = GHOST_PATTERN_ALPHA;
		for (const row of ghostRows) {
			const pattern = patterns[row.patternIndex];
			const y = (row.displayIndex + HEADER_ROW_OFFSET) * fontMetrics.lineHeight;
			drawRow(pattern, row.rowIndex, y, row.isSelected);
		}

		ctx.globalAlpha = 1.0;
		for (const row of visibleRows) {
			const pattern = patterns[row.patternIndex];
			const y = (row.displayIndex + HEADER_ROW_OFFSET) * fontMetrics.lineHeight;
			drawRow(pattern, row.rowIndex, y, row.isSelected);
		}
	}

	function drawHeader() {
		ctx.fillStyle = '#1e293b';
		ctx.fillRect(0, 0, canvasWidth, fontMetrics.lineHeight);

		ctx.fillStyle = HEADER_COLOR;

		const currentPattern = patterns[currentPatternIndex];
		if (!currentPattern) return;

		const channels = ['Channel A', 'Channel B', 'Channel C'];
		for (let i = 0; i < 3; i++) {
			const elementIndex = 4 + i * 6;
			const x = getElementPosition(elementIndex, currentPattern, 0);
			ctx.fillText(channels[i], Math.round(x), Math.round(fontMetrics.lineHeight / 2));
		}

		ctx.strokeStyle = SEPARATOR_COLOR;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(0, fontMetrics.lineHeight);
		ctx.lineTo(canvasWidth, fontMetrics.lineHeight);
		ctx.stroke();

		drawVerticalSeparators();
	}

	function drawVerticalSeparators() {
		ctx.strokeStyle = SEPARATOR_COLOR;
		ctx.lineWidth = 1;

		const currentPattern = patterns[currentPatternIndex];
		if (!currentPattern) return;

		const { charWidth } = fontMetrics;
		const separatorPositions = [];

		const rowIndex = 0;

		const envelopeContent = getElementContent(1, currentPattern, rowIndex);
		const envelopeWidth = ctx.measureText(envelopeContent).width;
		separatorPositions.push(
			getElementPosition(1, currentPattern, rowIndex) + envelopeWidth + charWidth / 2
		);

		const envelopeEffectContent = getElementContent(2, currentPattern, rowIndex);
		const envelopeEffectWidth = ctx.measureText(envelopeEffectContent).width;
		separatorPositions.push(
			getElementPosition(2, currentPattern, rowIndex) + envelopeEffectWidth + charWidth / 2
		);

		const noiseContent = getElementContent(3, currentPattern, rowIndex);
		const noiseWidth = ctx.measureText(noiseContent).width;
		separatorPositions.push(
			getElementPosition(3, currentPattern, rowIndex) + noiseWidth + charWidth / 2
		);

		for (let i = 0; i < 2; i++) {
			const lastElementIndex = 4 + (i + 1) * 6 - 1;
			const lastElementContent = getElementContent(
				lastElementIndex,
				currentPattern,
				rowIndex
			);
			const lastElementWidth = ctx.measureText(lastElementContent).width;
			const x =
				getElementPosition(lastElementIndex, currentPattern, rowIndex) +
				lastElementWidth +
				charWidth / 2;
			separatorPositions.push(x);
		}

		separatorPositions.forEach((x) => drawVerticalLine(x));
	}

	function drawVerticalLine(x: number) {
		ctx.beginPath();
		ctx.moveTo(Math.round(x), fontMetrics.lineHeight);
		ctx.lineTo(Math.round(x), canvasHeight);
		ctx.stroke();
	}

	function drawRow(pattern: Pattern, rowIndex: number, y: number, isSelected: boolean = false) {
		if (rowIndex % 8 >= 4) {
			ctx.fillStyle = ALTERNATE_ROW_COLOR;
			ctx.fillRect(0, y, canvasWidth, fontMetrics.lineHeight);
		}

		if (isSelected) {
			ctx.fillStyle = SELECTED_ROW_COLOR;
			ctx.fillRect(0, y, canvasWidth, fontMetrics.lineHeight);

			ctx.strokeStyle = '#3b82f640';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.rect(0, y, canvasWidth, fontMetrics.lineHeight);
			ctx.stroke();
		}

		ctx.fillStyle = ROW_NUMBER_COLOR;
		const rowNumberContent = getElementContent(0, pattern, rowIndex);
		ctx.fillText(
			rowNumberContent,
			Math.round(getElementPosition(0, pattern, rowIndex)),
			Math.round(y + fontMetrics.lineHeight / 2)
		);

		const cells = getCellsForRow(pattern, rowIndex);

		for (const cell of cells) {
			const cellValue = cell.value.toString();

			let color = TEXT_COLOR;

			const isCompletelyEmpty =
				cellValue === '....' ||
				cellValue === '..' ||
				cellValue === '.' ||
				cellValue === '---' ||
				cellValue === 'R--';

			if (isCompletelyEmpty) {
				color = EMPTY_TEXT_COLOR;
			} else if (cell.type === 'note') {
				color = NOTE_COLOR;
			} else if (cell.type === 'instrument') {
				color = INSTRUMENT_COLOR;
			} else if (cell.type === 'effect') {
				color = EFFECT_COLOR;
			} else if (cell.type === 'envelope') {
				color = ENVELOPE_COLOR;
			} else if (cell.type === 'envelope_effect') {
				color = EFFECT_COLOR;
			} else if (cell.type === 'noise') {
				color = NOISE_COLOR;
			}

			ctx.fillStyle = color;

			ctx.fillText(cellValue, Math.round(cell.x), Math.round(y + fontMetrics.lineHeight / 2));
		}
	}

	function setupCanvas() {
		if (!canvas) return;

		const dpr = window.devicePixelRatio || 1;

		canvas.width = canvasWidth * dpr;
		canvas.height = canvasHeight * dpr;

		canvas.style.width = canvasWidth + 'px';
		canvas.style.height = canvasHeight + 'px';

		ctx = canvas.getContext('2d')!;
		ctx.scale(dpr, dpr);

		ctx.imageSmoothingEnabled = false;
	}

	function updateCursorPositionY(deltaY: number) {
		const currentPattern = patterns[currentPatternIndex];
		if (!currentPattern) return;

		if (deltaY < 0) {
			if (selectedRow - 1 < 0 && currentPatternOrderIndex > 0) {
				currentPatternOrderIndex--;
				const prevPatternIndex = patternOrder[currentPatternOrderIndex];
				const prevPattern = patterns[prevPatternIndex];
				selectedRow = prevPattern.length - 1;
			} else if (selectedRow - 1 < 0 && currentPatternOrderIndex === 0) {
				return;
			} else {
				selectedRow = selectedRow - 1;
			}
		} else {
			if (
				selectedRow + 1 >= currentPattern.length &&
				currentPatternOrderIndex < patternOrder.length - 1
			) {
				currentPatternOrderIndex++;
				selectedRow = 0;
			} else if (
				selectedRow + 1 >= currentPattern.length &&
				currentPatternOrderIndex >= patternOrder.length - 1
			) {
				return;
			} else {
				selectedRow = selectedRow + 1;
			}
		}
	}

	function handleWheel(event: WheelEvent) {
		updateCursorPositionY(Math.sign(event.deltaY));
	}

	function handleKeyDown(event: KeyboardEvent) {
		const currentPattern = patterns[currentPatternIndex];
		if (!currentPattern) return;

		const { visibleRowsAbove, visibleRowsBelow } = calculateVisibleRowCounts();

		switch (event.key) {
			case 'ArrowUp':
				event.preventDefault();
				if (selectedRow > 0) {
					selectedRow = selectedRow - 1;
				} else {
					if (currentPatternOrderIndex > 0) {
						currentPatternOrderIndex = currentPatternOrderIndex - 1;
						const prevPatternIndex = patternOrder[currentPatternOrderIndex];
						const prevPattern = patterns[prevPatternIndex];
						selectedRow = prevPattern.length - 1;
					}
				}
				break;
			case 'ArrowDown':
				event.preventDefault();
				if (selectedRow < currentPattern.length - 1) {
					selectedRow = selectedRow + 1;
				} else {
					if (currentPatternOrderIndex < patternOrder.length - 1) {
						currentPatternOrderIndex = currentPatternOrderIndex + 1;
						selectedRow = 0;
					}
				}
				break;
			case 'PageUp':
				event.preventDefault();
				const newRowUp = selectedRow - visibleRowsAbove;
				if (newRowUp >= 0) {
					selectedRow = newRowUp;
				} else {
					if (currentPatternOrderIndex > 0) {
						currentPatternOrderIndex = currentPatternOrderIndex - 1;
						const prevPatternIndex = patternOrder[currentPatternOrderIndex];
						const prevPattern = patterns[prevPatternIndex];
						selectedRow = Math.max(0, prevPattern.length + newRowUp);
					} else {
						selectedRow = 0;
					}
				}
				break;
			case 'PageDown':
				event.preventDefault();
				const newRowDown = selectedRow + visibleRowsBelow;
				if (newRowDown < currentPattern.length) {
					selectedRow = newRowDown;
				} else {
					if (currentPatternOrderIndex < patternOrder.length - 1) {
						currentPatternOrderIndex = currentPatternOrderIndex + 1;
						selectedRow = newRowDown - currentPattern.length;
					} else {
						selectedRow = currentPattern.length - 1;
					}
				}
				break;
			case 'Home':
				event.preventDefault();
				selectedRow = 0;
				break;
			case 'End':
				event.preventDefault();
				selectedRow = currentPattern.length - 1;
				break;
		}
	}

	function updateViewportHeight() {
		viewportHeight = Math.max(500, window.innerHeight * 0.9);
	}

	$effect(() => {
		updateViewportHeight();

		const handleResize = () => {
			updateViewportHeight();
			if (canvas) {
				setupCanvas();
				draw();
			}
		};

		window.addEventListener('resize', handleResize);

		if (
			canvas &&
			((patterns && currentPatternOrderIndex !== undefined) ||
				selectedRow !== undefined ||
				viewportHeight)
		) {
			setupCanvas();
			draw();
		}

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});
</script>

<canvas
	bind:this={canvas}
	height={canvasHeight}
	width={canvasWidth}
	tabindex="0"
	onkeydown={handleKeyDown}
	onwheel={handleWheel}
	class="focus:ring-1 focus:ring-blue-500/50 focus:outline-none">
</canvas>
