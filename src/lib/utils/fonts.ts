export function getFonts() {
	const style = getComputedStyle(document.documentElement);

	return {
		mono: style.getPropertyValue('--font-mono').trim() || 'monospace',
		sans: style.getPropertyValue('--font-sans').trim() || 'sans-serif'
	};
}
