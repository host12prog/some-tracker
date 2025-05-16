<script lang="ts">
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	const SQUARE_SIZE = 50;
	let x = $state(100);
	let y = $state(100);

	function draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.fillStyle = 'black';
		ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
	}

	function handleKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowLeft':
				x = Math.max(0, x - SQUARE_SIZE);
				break;
			case 'ArrowRight':
				x = Math.min(canvas.width - SQUARE_SIZE, x + SQUARE_SIZE);
				break;
			case 'ArrowUp':
				y = Math.max(0, y - SQUARE_SIZE);
				break;
			case 'ArrowDown':
				y = Math.min(canvas.height - SQUARE_SIZE, y + SQUARE_SIZE);
				break;
		}
		draw();
	}

	$effect(() => {
		ctx = canvas.getContext('2d')!;
		draw();
		window.addEventListener('keydown', handleKeydown);

		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<div class="canvas-container">
	<canvas bind:this={canvas} width={500} height={300}></canvas>
</div>

<style>
	.canvas-container {
		margin: 1rem 0;
		border: 1px solid #ccc;
		border-radius: 4px;
		overflow: hidden;
	}

	canvas {
		display: block;
		background: #f5f5f5;
	}
</style>
