<script lang="ts">
	import type { Pattern } from '../../models/song';
	import { getColors } from '../../utils/colors';
	import { getFonts } from '../../utils/fonts';

	interface Props {
		currentPatternOrderIndex: number;
		patterns: Pattern[];
		selectedRow: number;
		patternOrder: number[];
		canvasHeight?: number;
		lineHeight?: number;
	}

	let {
		currentPatternOrderIndex = $bindable(),
		patterns = $bindable(),
		selectedRow = $bindable(),
		patternOrder = $bindable(),
		canvasHeight = 600
	}: Props = $props();

	const FONT_SIZE = 14;
	const CELL_WIDTH = 32;
	const CELL_HEIGHT = 28;
	const PADDING = 12;
	const FADE_HEIGHT = 30;

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	const canvasWidth = CELL_WIDTH + PADDING * 2;

	let COLORS = getColors();
	let FONTS = getFonts();

	$effect(() => {
		if (!canvas) return;

		ctx = canvas.getContext('2d')!;
		setupCanvas();
		draw();
	});

	$effect(() => {
		if (ctx) draw();
	});

	function setupCanvas(): void {
		const dpr = window.devicePixelRatio || 1;
		canvas.width = canvasWidth * dpr;
		canvas.height = canvasHeight * dpr;
		canvas.style.width = `${canvasWidth}px`;
		canvas.style.height = `${canvasHeight}px`;

		ctx.scale(dpr, dpr);
		ctx.font = `${FONT_SIZE}px ${FONTS.mono}`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
	}

	function getVisibleRange() {
		const visibleCount = Math.floor(canvasHeight / CELL_HEIGHT);
		const halfVisible = Math.floor(visibleCount / 2);
		const startIndex = Math.max(0, currentPatternOrderIndex - halfVisible);

		const idealEndIndex = currentPatternOrderIndex + halfVisible;
		const endIndex = Math.min(patternOrder.length - 1, idealEndIndex);

		return { startIndex, endIndex };
	}

	function draw(): void {
		if (!ctx) return;

		const centerY = canvasHeight / 2;

		ctx.fillStyle = COLORS.patternBg;
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		const { startIndex, endIndex } = getVisibleRange();

		for (let i = startIndex; i <= endIndex; i++) {
			if (i < 0 || i >= patternOrder.length) continue;

			const pattern = patterns[patternOrder[i]];
			if (!pattern) continue;

			const y = centerY - (currentPatternOrderIndex - i) * CELL_HEIGHT;

			if (y < -CELL_HEIGHT || y > canvasHeight + CELL_HEIGHT) continue;

			drawPatternCell(pattern, y, i === currentPatternOrderIndex, i);
		}

		drawScrollIndicators(startIndex, endIndex);
	}

	function drawPatternCell(
		pattern: Pattern,
		y: number,
		isSelected: boolean,
		index: number
	): void {
		const cellY = y - CELL_HEIGHT / 2;
		const isHovered = hoveredIndex === index;

		if (isSelected) {
			ctx.fillStyle = COLORS.patternNoise;
			ctx.fillRect(PADDING, cellY, CELL_WIDTH, CELL_HEIGHT);

			ctx.strokeStyle = COLORS.patternInstrument;
			ctx.lineWidth = 1;
			ctx.strokeRect(PADDING + 0.5, cellY + 0.5, CELL_WIDTH - 1, CELL_HEIGHT - 1);
		} else if (isHovered) {
			// Hover highlight - lighter version of the background
			ctx.fillStyle = COLORS.patternHeader;
			ctx.fillRect(PADDING, cellY, CELL_WIDTH, CELL_HEIGHT);

			ctx.strokeStyle = COLORS.patternInstrument;
			ctx.lineWidth = 1;
			ctx.strokeRect(PADDING + 0.5, cellY + 0.5, CELL_WIDTH - 1, CELL_HEIGHT - 1);
		} else {
			ctx.fillStyle = index % 2 === 0 ? COLORS.patternBg : COLORS.patternAlternate;
			ctx.fillRect(PADDING, cellY, CELL_WIDTH, CELL_HEIGHT);

			ctx.strokeStyle = COLORS.patternEmpty;
			ctx.lineWidth = 1;
			ctx.strokeRect(PADDING + 0.5, cellY + 0.5, CELL_WIDTH - 1, CELL_HEIGHT - 1);
		}

		ctx.fillStyle = COLORS.patternText;
		ctx.fillText(pattern.id.toString().padStart(2, '0'), PADDING + CELL_WIDTH / 2, y);

		if (isSelected) {
			ctx.save();
			ctx.fillStyle = COLORS.patternEnvelope;
			ctx.textAlign = 'left';
			ctx.fillText('►', 2, y);
			ctx.restore();
		}
	}

	function drawScrollIndicators(startIndex: number, endIndex: number): void {
		const hasMoreAbove = startIndex > 0;
		const visibleCount = Math.floor(canvasHeight / CELL_HEIGHT);
		const halfVisible = Math.floor(visibleCount / 2);
		const maxVisibleEndIndex = currentPatternOrderIndex + halfVisible;
		const hasMoreBelow = maxVisibleEndIndex < patternOrder.length - 1;

		if (hasMoreAbove) {
			const topGradient = ctx.createLinearGradient(0, 0, 0, FADE_HEIGHT);
			topGradient.addColorStop(0, COLORS.patternBg);
			topGradient.addColorStop(1, 'rgba(0,0,0,0)');
			ctx.fillStyle = topGradient;
			ctx.fillRect(0, 0, canvasWidth, FADE_HEIGHT);
		}

		if (hasMoreBelow) {
			const bottomGradient = ctx.createLinearGradient(
				0,
				canvasHeight - FADE_HEIGHT,
				0,
				canvasHeight
			);
			bottomGradient.addColorStop(0, 'rgba(0,0,0,0)');
			bottomGradient.addColorStop(1, COLORS.patternBg);
			ctx.fillStyle = bottomGradient;
			ctx.fillRect(0, canvasHeight - FADE_HEIGHT, canvasWidth, FADE_HEIGHT);
		}

		ctx.save();
		ctx.fillStyle = COLORS.patternEnvelope;
		ctx.textAlign = 'center';
		ctx.font = `${FONT_SIZE}px ${FONTS.mono}`;

		if (hasMoreAbove) {
			ctx.textBaseline = 'top';
			ctx.fillText('▲', canvasWidth / 2, 2);
		}
		if (hasMoreBelow) {
			ctx.textBaseline = 'bottom';
			ctx.fillText('▼', canvasWidth / 2, canvasHeight - 2);
		}
		ctx.restore();
	}

	function handleClick(event: MouseEvent): void {
		const rect = canvas.getBoundingClientRect();
		const y = event.clientY - rect.top;
		const centerY = canvasHeight / 2;

		const clickedIndex = Math.round(currentPatternOrderIndex + (y - centerY) / CELL_HEIGHT);

		if (clickedIndex >= 0 && clickedIndex < patternOrder.length) {
			switchPattern(clickedIndex);
		}
	}

	function handleWheel(event: WheelEvent): void {
		event.preventDefault();
		const newIndex = currentPatternOrderIndex + Math.sign(event.deltaY);

		if (newIndex >= 0 && newIndex < patternOrder.length) {
			switchPattern(newIndex);
		}
	}

	function handleKeyDown(event: KeyboardEvent): void {
		const { key } = event;

		if (key === 'ArrowUp' && currentPatternOrderIndex > 0) {
			event.preventDefault();
			switchPattern(currentPatternOrderIndex - 1);
		} else if (key === 'ArrowDown' && currentPatternOrderIndex < patternOrder.length - 1) {
			event.preventDefault();
			switchPattern(currentPatternOrderIndex + 1);
		}
	}

	let lastMouseY: number | null = null;
	let hoveredIndex: number | null = null;

	function updateCursor(mouseY?: number): void {
		if (!canvas || mouseY === undefined) return;

		const centerY = canvasHeight / 2;
		const newHoveredIndex = Math.round(
			currentPatternOrderIndex + (mouseY - centerY) / CELL_HEIGHT
		);

		const { startIndex, endIndex } = getVisibleRange();
		const isOverPattern =
			newHoveredIndex >= 0 &&
			newHoveredIndex < patternOrder.length &&
			newHoveredIndex >= startIndex &&
			newHoveredIndex <= endIndex;

		const previousHoveredIndex = hoveredIndex;
		hoveredIndex = isOverPattern ? newHoveredIndex : null;

		if (previousHoveredIndex !== hoveredIndex) {
			draw();
		}

		canvas.style.cursor = isOverPattern ? 'pointer' : 'default';
	}

	function switchPattern(index: number): void {
		currentPatternOrderIndex = index;
		selectedRow = 0;

		if (lastMouseY !== null) {
			updateCursor(lastMouseY);
		}
	}

	function handleMouseMove(event: MouseEvent): void {
		const rect = canvas.getBoundingClientRect();
		const y = event.clientY - rect.top;
		lastMouseY = y;
		updateCursor(y);
	}

	function handleMouseLeave(): void {
		const previousHoveredIndex = hoveredIndex;
		hoveredIndex = null;
		lastMouseY = null;
		canvas.style.cursor = 'default';

		if (previousHoveredIndex !== null) {
			draw();
		}
	}
</script>

<canvas
	bind:this={canvas}
	tabindex="0"
	onclick={handleClick}
	onwheel={handleWheel}
	onkeydown={handleKeyDown}
	onmousemove={handleMouseMove}
	onmouseleave={handleMouseLeave}
	class="block border border-[var(--pattern-empty)] bg-[var(--pattern-bg)] focus:ring-1 focus:ring-[var(--pattern-header)]/50 focus:outline-none"
	style="width: {canvasWidth}px; height: {canvasHeight}px;"></canvas>
