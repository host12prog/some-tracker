<script lang="ts">
	let audioContext: AudioContext | null = $state(null);
	let processorNode: AudioWorkletNode | null = $state(null);

	async function initAudio() {
		if (!audioContext) {
			audioContext = new AudioContext();

			const wasmUrl = import.meta.env.BASE_URL + 'ayumi.wasm';
			const response = await fetch(wasmUrl);
			const wasmBuffer = await response.arrayBuffer();

			const processorUrl = import.meta.env.BASE_URL + 'ayumi-processor.js';
			await audioContext.audioWorklet.addModule(processorUrl);

			processorNode = new AudioWorkletNode(audioContext, 'ayumi-processor', {
				outputChannelCount: [2]
			});

			processorNode.port.postMessage({
				type: 'init',
				wasmBuffer
			});

			processorNode.connect(audioContext.destination);
		}
	}

	async function playSound() {
		if (audioContext?.state === 'suspended') {
			await audioContext.resume();
		}

		processorNode?.port.postMessage({
			type: 'play',
			frequency: 440
		});
	}

	async function stopSound() {
		processorNode?.port.postMessage({
			type: 'stop'
		});

		await audioContext?.suspend();
	}

	$effect(() => {
		initAudio();
	});
</script>

<div>
	<button onclick={playSound}>Play</button>
	<button onclick={stopSound}>Stop Sound</button>
</div>
