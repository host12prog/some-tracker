export function getColors() {
	const style = getComputedStyle(document.documentElement);

	return {
		patternBg: style.getPropertyValue('--pattern-bg').trim(),
		patternText: style.getPropertyValue('--pattern-text').trim(),
		patternEmpty: style.getPropertyValue('--pattern-empty').trim(),
		patternNote: style.getPropertyValue('--pattern-note').trim(),
		patternInstrument: style.getPropertyValue('--pattern-instrument').trim(),
		patternEffect: style.getPropertyValue('--pattern-effect').trim(),
		patternEnvelope: style.getPropertyValue('--pattern-envelope').trim(),
		patternNoise: style.getPropertyValue('--pattern-noise').trim(),
		patternHeader: style.getPropertyValue('--pattern-header').trim(),
		patternSelected: style.getPropertyValue('--pattern-selected').trim(),
		patternCellSelected: style.getPropertyValue('--pattern-cell-selected').trim(),
		patternRowNum: style.getPropertyValue('--pattern-row-num').trim(),
		patternAlternate: style.getPropertyValue('--pattern-alternate').trim()
	};
}
