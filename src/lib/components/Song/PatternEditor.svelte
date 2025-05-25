<script lang="ts">
	import type { Effect, Pattern } from '../../models/song';
	import { NoteName } from '../../models/song';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

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

	const FONT_SIZE = 14;

	function getColors() {
		const style = getComputedStyle(document.documentElement);
		return {
			bg: style.getPropertyValue('--pattern-bg').trim(),
			text: style.getPropertyValue('--pattern-text').trim(),
			empty: style.getPropertyValue('--pattern-empty').trim(),
			note: style.getPropertyValue('--pattern-note').trim(),
			instrument: style.getPropertyValue('--pattern-instrument').trim(),
			effect: style.getPropertyValue('--pattern-effect').trim(),
			envelope: style.getPropertyValue('--pattern-envelope').trim(),
			noise: style.getPropertyValue('--pattern-noise').trim(),
			header: style.getPropertyValue('--pattern-header').trim(),
			selected: style.getPropertyValue('--pattern-selected').trim(),
			rowNum: style.getPropertyValue('--pattern-row-num').trim(),
			alternate: style.getPropertyValue('--pattern-alternate').trim()
		};
	}

	let COLORS = getColors();

	let canvasWidth = $state(800);
	let canvasHeight = $state(600);
	let lineHeight = FONT_SIZE * 1.8;

	let currentPattern = $derived(patterns[patternOrder[currentPatternOrderIndex]]);

	function formatNote(noteName: NoteName, octave: number): string {
		const notes = [
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
		return notes[noteName] + octave;
	}

	function formatHex(value: number, digits: number): string {
		if (value === 0) return '.'.repeat(digits);
		return value.toString(16).toUpperCase().padStart(digits, '0');
	}

	function formatInstrument(value: number): string {
		if (value === 0) return '.';
		return value <= 9 ? value.toString() : String.fromCharCode(65 + value - 10);
	}

	function formatEffect(effect: Effect | null): string {
		if (!effect) return '....';
		const type = effect.effect === 0 ? '.' : effect.effect.toString(16).toUpperCase();
		const delay = effect.delay === 0 ? '.' : effect.delay.toString(16).toUpperCase();
		const param = formatHex(effect.parameter, 2);
		return type + delay + param;
	}

	function getRowData(pattern: Pattern, rowIndex: number): string {
		const row = pattern.patternRows[rowIndex];
		const rowNum = rowIndex.toString(16).toUpperCase().padStart(2, '0');
		const envelope = formatHex(row.envelopeValue, 4);
		const envEffect = formatEffect(row.envelopeEffect);
		const noise = formatHex(row.noiseValue, 2);

		let channelData = '';
		for (let i = 0; i < 3; i++) {
			const ch = pattern.channels[i].rows[rowIndex];
			const note = formatNote(ch.note.name, ch.note.octave);
			const inst = formatInstrument(ch.instrument);
			const shape =
				ch.envelopeShape === 0 ? '.' : ch.envelopeShape.toString(16).toUpperCase();
			const orn = formatInstrument(ch.ornament);
			const vol = ch.volume === 0 ? '.' : ch.volume.toString(16).toUpperCase();
			const fx = formatEffect(ch.effects[0]);
			channelData += ` ${note} ${inst}${shape}${orn}${vol} ${fx}`;
		}

		return `${rowNum} ${envelope} ${envEffect} ${noise}${channelData}`;
	}

	function getVisibleRows() {
		const visibleCount = Math.floor(canvasHeight / lineHeight);
		const halfVisible = Math.floor(visibleCount / 2);
		const startRow = selectedRow - halfVisible;
		const endRow = selectedRow + halfVisible;

		const rows = [];
		let displayIndex = 0;

		for (let i = startRow; i <= endRow; i++) {
			let rowAdded = false;

			if (i >= 0 && i < currentPattern.length) {
				rows.push({
					rowIndex: i,
					isSelected: i === selectedRow,
					isGhost: false,
					patternIndex: patternOrder[currentPatternOrderIndex],
					displayIndex
				});
				rowAdded = true;
			} else if (i < 0) {
				const prevPatternOrderIndex = currentPatternOrderIndex - 1;
				if (prevPatternOrderIndex >= 0) {
					const prevPatternIndex = patternOrder[prevPatternOrderIndex];
					const prevPattern = patterns[prevPatternIndex];
					if (prevPattern) {
						const ghostRowIndex = prevPattern.length + i;
						if (ghostRowIndex >= 0 && ghostRowIndex < prevPattern.length) {
							rows.push({
								rowIndex: ghostRowIndex,
								isSelected: false,
								isGhost: true,
								patternIndex: prevPatternIndex,
								displayIndex
							});
							rowAdded = true;
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
						if (ghostRowIndex < nextPattern.length) {
							rows.push({
								rowIndex: ghostRowIndex,
								isSelected: false,
								isGhost: true,
								patternIndex: nextPatternIndex,
								displayIndex
							});
							rowAdded = true;
						}
					}
				}
			}

			if (!rowAdded) {
				rows.push({
					rowIndex: -1,
					isSelected: false,
					isGhost: false,
					patternIndex: -1,
					displayIndex,
					isEmpty: true
				});
			}

			displayIndex++;
		}
		return rows;
	}

	function setupCanvas() {
		if (!canvas) return;

		ctx = canvas.getContext('2d')!;

		updateSize();

		const dpr = window.devicePixelRatio || 1;
		canvas.width = canvasWidth * dpr;
		canvas.height = canvasHeight * dpr;
		canvas.style.width = canvasWidth + 'px';
		canvas.style.height = canvasHeight + 'px';

		ctx.scale(dpr, dpr);
		ctx.font = `${FONT_SIZE}px monospace`;
		ctx.textBaseline = 'middle';
	}

	function drawRow(rowData: string, y: number, isSelected: boolean, rowIndex: number) {
		if (rowIndex % 8 >= 4) {
			ctx.fillStyle = COLORS.alternate;
			ctx.fillRect(0, y, canvasWidth, lineHeight);
		}

		if (isSelected) {
			ctx.fillStyle = COLORS.selected;
			ctx.fillRect(0, y, canvasWidth, lineHeight);
		}

		const parts = rowData.split(' ');
		let x = 10;

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			if (!part) continue;

			let baseColor = COLORS.text;
			if (i === 0) {
				baseColor = COLORS.rowNum;
			} else if (i >= 4 && (i - 4) % 3 === 0) {
				baseColor = COLORS.note;
			} else if (i >= 4 && (i - 4) % 3 === 1) {
				baseColor = COLORS.instrument;
			} else if (i >= 4 && (i - 4) % 3 === 2) {
				baseColor = COLORS.effect;
			} else if (i === 1) {
				baseColor = COLORS.envelope;
			} else if (i === 2) {
				baseColor = COLORS.effect;
			} else if (i === 3) {
				baseColor = COLORS.noise;
			}

			const isNote = i >= 4 && (i - 4) % 3 === 0;

			if (isNote && part === '---') {
				ctx.fillStyle = COLORS.empty;
				ctx.fillText(part, x, y + lineHeight / 2);
				x += ctx.measureText(part).width;
			} else if (isNote) {
				ctx.fillStyle = baseColor;
				ctx.fillText(part, x, y + lineHeight / 2);
				x += ctx.measureText(part).width;
			} else {
				for (let charIndex = 0; charIndex < part.length; charIndex++) {
					const char = part[charIndex];
					const color = char === '.' || char === '-' ? COLORS.empty : baseColor;

					ctx.fillStyle = color;
					ctx.fillText(char, x, y + lineHeight / 2);
					x += ctx.measureText(char).width;
				}
			}

			x += ctx.measureText(' ').width;
		}
	}

	function draw() {
		if (!ctx || !currentPattern) return;

		ctx.fillStyle = COLORS.bg;
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		const visibleRows = getVisibleRows();
		visibleRows.forEach((row) => {
			const y = row.displayIndex * lineHeight;

			if (row.isEmpty) {
				return;
			}

			if (row.isGhost) {
				ctx.globalAlpha = 0.3;
			} else {
				ctx.globalAlpha = 1.0;
			}

			const pattern = patterns[row.patternIndex];
			if (pattern) {
				const rowData = getRowData(pattern, row.rowIndex);
				drawRow(rowData, y, row.isSelected, row.rowIndex);
			}
		});

		ctx.globalAlpha = 1.0;
	}

	function moveRow(delta: number) {
		const newRow = selectedRow + delta;
		if (newRow >= 0 && newRow < currentPattern.length) {
			selectedRow = newRow;
		} else if (delta < 0 && currentPatternOrderIndex > 0) {
			currentPatternOrderIndex--;
			selectedRow = patterns[patternOrder[currentPatternOrderIndex]].length - 1;
		} else if (delta > 0 && currentPatternOrderIndex < patternOrder.length - 1) {
			currentPatternOrderIndex++;
			selectedRow = 0;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowUp':
				event.preventDefault();
				moveRow(-1);
				break;
			case 'ArrowDown':
				event.preventDefault();
				moveRow(1);
				break;
			case 'PageUp':
				event.preventDefault();
				moveRow(-16);
				break;
			case 'PageDown':
				event.preventDefault();
				moveRow(16);
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

	function handleWheel(event: WheelEvent) {
		moveRow(Math.sign(event.deltaY));
	}

	function updateSize() {
		canvasHeight = Math.max(100, window.innerHeight - 200);
		if (ctx && currentPattern) {
			const sampleRowData = getRowData(currentPattern, 0);
			canvasWidth = ctx.measureText(sampleRowData).width + 20;
		} else {
			canvasWidth = 800;
		}
	}

	$effect(() => {
		updateSize();
		if (canvas) {
			setupCanvas();
			draw();
		}

		const handleResize = () => {
			updateSize();
			if (canvas) {
				setupCanvas();
				draw();
			}
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});
</script>

<canvas
	bind:this={canvas}
	tabindex="0"
	onkeydown={handleKeyDown}
	onwheel={handleWheel}
	class="block rounded-md border-[var(--pattern-empty)] focus:ring-1 focus:ring-[var(--pattern-header)]/50 focus:outline-none">
</canvas>
