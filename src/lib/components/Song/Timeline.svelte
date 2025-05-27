<script lang="ts">
	import type { Pattern } from '../../models/song';
	import { NoteName } from '../../models/song';
	import { getColors } from '../../utils/colors';
	import { getFonts } from '../../utils/fonts';

	let timelineCanvas: HTMLCanvasElement;
	let timelineCtx: CanvasRenderingContext2D;

	let COLORS = getColors();
	let FONTS = getFonts();

	let {
		patterns,
		patternOrder,
		currentPatternOrderIndex = $bindable(),
		selectedRow = $bindable(),
		canvasHeight,
		lineHeight
	}: {
		patterns: Pattern[];
		patternOrder: number[];
		currentPatternOrderIndex: number;
		selectedRow: number;
		canvasHeight: number;
		lineHeight: number;
	} = $props();

	let isDraggingTimeline = $state(false);
	let timelineHeight = $state(0);
	let timelineThumbHeight = $state(0);
	let timelineThumbTop = $state(0);

	const TIMELINE_WIDTH = 70;

	let cachedTotalRows = 0;
	let cachedPatternStarts: number[] = [];

	function setupTimelineCanvas() {
		if (!timelineCanvas) return;

		timelineCtx = timelineCanvas.getContext('2d')!;

		const dpr = window.devicePixelRatio || 1;
		timelineCanvas.width = TIMELINE_WIDTH * dpr;
		timelineCanvas.height = canvasHeight * dpr;
		timelineCanvas.style.width = TIMELINE_WIDTH + 'px';
		timelineCanvas.style.height = canvasHeight + 'px';

		timelineCtx.scale(dpr, dpr);
		timelineCtx.font = `10px ${FONTS.mono}`;
		timelineCtx.textBaseline = 'middle';
		timelineCtx.textAlign = 'center';
	}

	function analyzePatternContent(pattern: Pattern) {
		const contentMap = [];

		for (let rowIndex = 0; rowIndex < pattern.length; rowIndex++) {
			const row = pattern.patternRows[rowIndex];
			let hasContent = false;
			let contentTypes = {
				envelope: false,
				noise: false,
				channels: [false, false, false]
			};

			if (row.envelopeValue !== 0 || row.envelopeEffect) {
				hasContent = true;
				contentTypes.envelope = true;
			}

			if (row.noiseValue !== 0) {
				hasContent = true;
				contentTypes.noise = true;
			}

			for (let i = 0; i < 3; i++) {
				const ch = pattern.channels[i].rows[rowIndex];
				if (
					ch.note.name !== NoteName.None ||
					ch.instrument !== 0 ||
					ch.envelopeShape !== 0 ||
					ch.ornament !== 0 ||
					ch.volume !== 0 ||
					(ch.effects[0] && ch.effects[0].effect !== 0)
				) {
					hasContent = true;
					contentTypes.channels[i] = true;
				}
			}

			contentMap.push({ hasContent, contentTypes });
		}

		return contentMap;
	}

	function drawTimeline() {
		if (!timelineCtx || !patterns || !patternOrder) return;

		timelineCtx.fillStyle = COLORS.patternBg;
		timelineCtx.fillRect(0, 0, TIMELINE_WIDTH, canvasHeight);

		let totalTrackRows = 0;
		const segments = [];

		for (const patternIndex of patternOrder) {
			if (patterns[patternIndex]) {
				totalTrackRows += patterns[patternIndex].length;
			}
		}

		if (totalTrackRows === 0) return;

		let currentY = 0;
		for (let orderIdx = 0; orderIdx < patternOrder.length; orderIdx++) {
			const patternIndex = patternOrder[orderIdx];
			const pattern = patterns[patternIndex];
			if (!pattern) continue;

			const segmentHeight = (pattern.length / totalTrackRows) * canvasHeight;
			const isActive = orderIdx === currentPatternOrderIndex;
			const contentMap = analyzePatternContent(pattern);

			segments.push({
				patternIndex,
				orderIndex: orderIdx,
				y: currentY,
				height: segmentHeight,
				rows: pattern.length,
				isActive,
				contentMap
			});

			currentY += segmentHeight;
		}

		segments.forEach((segment) => {
			const x = 0;
			const y = segment.y;
			const width = TIMELINE_WIDTH;
			const height = Math.max(16, segment.height);

			if (segment.isActive) {
				timelineCtx.fillStyle = COLORS.patternSelected;
			} else {
				timelineCtx.fillStyle = COLORS.patternAlternate;
			}
			timelineCtx.fillRect(x, y, width, height);

			timelineCtx.strokeStyle = COLORS.patternText;
			timelineCtx.lineWidth = 1;
			timelineCtx.strokeRect(x, y, width, height);

			timelineCtx.fillStyle = COLORS.patternText;
			const labelY = y + 8;
			const patternLabel = segment.patternIndex.toString(16).toUpperCase().padStart(2, '0');
			timelineCtx.fillText(patternLabel, width / 2, labelY);

			if (height > 20) {
				const contentAreaY = y + 12;
				const contentAreaHeight = height - 12;
				const availableWidth = width - 4;
				const envelopeWidth = Math.floor(availableWidth * 0.22);
				const noiseWidth = Math.floor(availableWidth * 0.12);
				const channelWidth = Math.floor(availableWidth * 0.22);

				for (let rowIndex = 0; rowIndex < segment.rows; rowIndex++) {
					const rowY = contentAreaY + (rowIndex / segment.rows) * contentAreaHeight;
					const rowHeight = Math.max(1, contentAreaHeight / segment.rows);
					const content = segment.contentMap[rowIndex];

					if (!content.hasContent) continue;

					let xOffset = 2;

					if (content.contentTypes.envelope) {
						timelineCtx.fillStyle = COLORS.patternEnvelope;
						timelineCtx.fillRect(x + xOffset, rowY, envelopeWidth, rowHeight);
					}
					xOffset += envelopeWidth + 1;

					if (content.contentTypes.noise) {
						timelineCtx.fillStyle = COLORS.patternNoise;
						timelineCtx.fillRect(x + xOffset, rowY, noiseWidth, rowHeight);
					}
					xOffset += noiseWidth + 1;

					if (content.contentTypes.channels[0]) {
						timelineCtx.fillStyle = COLORS.patternNote;
						timelineCtx.fillRect(x + xOffset, rowY, channelWidth, rowHeight);
					}
					xOffset += channelWidth + 1;

					if (content.contentTypes.channels[1]) {
						timelineCtx.fillStyle = COLORS.patternNote;
						timelineCtx.fillRect(x + xOffset, rowY, channelWidth, rowHeight);
					}
					xOffset += channelWidth + 1;

					if (content.contentTypes.channels[2]) {
						timelineCtx.fillStyle = COLORS.patternNote;
						timelineCtx.fillRect(x + xOffset, rowY, channelWidth, rowHeight);
					}
				}

				timelineCtx.strokeStyle = COLORS.patternRowNum;
				timelineCtx.lineWidth = 0.5;
				timelineCtx.globalAlpha = 0.3;

				for (let rowIndex = 4; rowIndex < segment.rows; rowIndex += 4) {
					const rowY = contentAreaY + (rowIndex / segment.rows) * contentAreaHeight;
					timelineCtx.beginPath();
					timelineCtx.moveTo(x + 2, rowY);
					timelineCtx.lineTo(x + width - 2, rowY);
					timelineCtx.stroke();
				}
				timelineCtx.globalAlpha = 1.0;
			}
		});

		updateTimelinePosition();
		timelineCtx.fillStyle = '#ff6b35';
		timelineCtx.globalAlpha = 0.8;
		timelineCtx.fillRect(TIMELINE_WIDTH - 6, timelineThumbTop, 4, timelineThumbHeight);
		timelineCtx.globalAlpha = 1.0;
	}

	function updateTimelinePosition() {
		if (!patterns || !patternOrder || canvasHeight <= 0) return;

		timelineHeight = canvasHeight;
		const visibleRows = Math.floor(canvasHeight / lineHeight);

		let totalTrackRows = 0;
		for (const patternIndex of patternOrder) {
			if (patterns[patternIndex]) {
				totalTrackRows += patterns[patternIndex].length;
			}
		}

		if (totalTrackRows === 0) return;

		let currentAbsoluteRow = 0;
		for (let i = 0; i < currentPatternOrderIndex; i++) {
			const patternIndex = patternOrder[i];
			if (patterns[patternIndex]) {
				currentAbsoluteRow += patterns[patternIndex].length;
			}
		}
		currentAbsoluteRow += selectedRow;

		timelineThumbHeight = Math.max(
			8,
			Math.min(timelineHeight, (visibleRows / totalTrackRows) * timelineHeight)
		);

		const maxScrollableRows = Math.max(0, totalTrackRows - visibleRows);
		if (maxScrollableRows > 0) {
			const scrollProgress = Math.max(0, Math.min(1, currentAbsoluteRow / maxScrollableRows));
			timelineThumbTop = scrollProgress * (timelineHeight - timelineThumbHeight);
		} else {
			timelineThumbTop = 0;
		}

		timelineThumbTop = Math.max(
			0,
			Math.min(timelineThumbTop, timelineHeight - timelineThumbHeight)
		);
	}

	function cacheTrackStructure() {
		cachedTotalRows = 0;
		cachedPatternStarts = [];

		for (const patternIndex of patternOrder) {
			cachedPatternStarts.push(cachedTotalRows);
			if (patterns[patternIndex]) {
				cachedTotalRows += patterns[patternIndex].length;
			}
		}
	}

	function jumpToTrackPosition(y: number) {
		if (cachedTotalRows === 0 || timelineHeight <= 0) return;

		const visibleRows = Math.floor(canvasHeight / lineHeight);
		const maxScrollableRows = Math.max(0, cachedTotalRows - visibleRows);

		if (maxScrollableRows > 0) {
			const clickProgress = Math.max(0, Math.min(1, y / timelineHeight));
			const targetAbsoluteRow = Math.floor(clickProgress * maxScrollableRows);

			for (
				let patternOrderIdx = 0;
				patternOrderIdx < patternOrder.length;
				patternOrderIdx++
			) {
				const patternIndex = patternOrder[patternOrderIdx];
				const pattern = patterns[patternIndex];
				if (!pattern) continue;

				const patternStart = cachedPatternStarts[patternOrderIdx];
				const patternEnd = patternStart + pattern.length;

				if (targetAbsoluteRow >= patternStart && targetAbsoluteRow < patternEnd) {
					currentPatternOrderIndex = patternOrderIdx;
					selectedRow = targetAbsoluteRow - patternStart;
					selectedRow = Math.max(0, Math.min(selectedRow, pattern.length - 1));
					break;
				}
			}
		}
	}

	function handleTimelineMouseDown(event: MouseEvent) {
		if (!patterns || !patternOrder || !timelineCanvas) return;

		const rect = timelineCanvas.getBoundingClientRect();
		const y = event.clientY - rect.top;

		if (y >= timelineThumbTop && y <= timelineThumbTop + timelineThumbHeight) {
			isDraggingTimeline = true;
			event.preventDefault();
			return;
		}

		jumpToTrackPosition(y);
		event.preventDefault();
	}

	function handleTimelineMouseMove(event: MouseEvent) {
		if (!isDraggingTimeline || !patterns || !patternOrder || !timelineCanvas) return;

		const rect = timelineCanvas.getBoundingClientRect();
		const y = event.clientY - rect.top;

		requestAnimationFrame(() => {
			jumpToTrackPosition(y);
		});
	}

	function handleTimelineMouseUp() {
		isDraggingTimeline = false;
	}

	$effect(() => {
		patterns;
		patternOrder;
		canvasHeight;
		selectedRow;
		currentPatternOrderIndex;

		cacheTrackStructure();

		if (timelineCanvas) {
			setupTimelineCanvas();
			drawTimeline();
		}

		const handleGlobalMouseMove = (event: MouseEvent) => {
			if (isDraggingTimeline) {
				handleTimelineMouseMove(event);
			}
		};

		const handleGlobalMouseUp = () => {
			if (isDraggingTimeline) {
				handleTimelineMouseUp();
			}
		};

		window.addEventListener('mousemove', handleGlobalMouseMove);
		window.addEventListener('mouseup', handleGlobalMouseUp);

		return () => {
			window.removeEventListener('mousemove', handleGlobalMouseMove);
			window.removeEventListener('mouseup', handleGlobalMouseUp);
		};
	});
</script>

<canvas
	bind:this={timelineCanvas}
	onmousedown={handleTimelineMouseDown}
	class="block cursor-pointer border-l border-[var(--pattern-empty)]">
</canvas>
