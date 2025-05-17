const AYUMI_STRUCT_SIZE = 22904;
const AYUMI_STRUCT_LEFT_OFFSET = AYUMI_STRUCT_SIZE - 16;
const AYUMI_STRUCT_RIGHT_OFFSET = AYUMI_STRUCT_SIZE - 8;

let wasmModule = null;
let ayumiPtr = null;


class AyumiProcessor extends AudioWorkletProcessor {
	constructor() {
		super();
		this.initialized = false;
		this.port.onmessage = this.handleMessage.bind(this);
		this.step = 0;
		this.stepCounter = 0;
		this.arpeggioFrequencies = [352000, 396000, 440000, 484000];
		this.stepsPerNote = 1000;
	}

	async handleMessage(event) {
		const { type, frequency, wasmBuffer } = event.data;

		if (type === 'init' && wasmBuffer && !wasmModule) {
			try {
				const result = await WebAssembly.instantiate(wasmBuffer, {
					env: {
						emscripten_notify_memory_growth: () => {}
					}
				});

				wasmModule = result.instance.exports;

				ayumiPtr = wasmModule.malloc(AYUMI_STRUCT_SIZE);

				wasmModule.ayumi_configure(ayumiPtr, 0, 1773400, sampleRate);
				wasmModule.ayumi_set_pan(ayumiPtr, 0, 0.1, 0);
				wasmModule.ayumi_set_pan(ayumiPtr, 1, 0.5, 0);
				wasmModule.ayumi_set_pan(ayumiPtr, 2, 0.9, 0);

				this.initialized = true;
			} catch (error) {
				console.error('Failed to initialize Ayumi:', error);
			}
		} else if (type === 'play' && wasmModule && this.initialized) {
			wasmModule.ayumi_set_tone(ayumiPtr, 1, 1773400 / frequency * 1000);
			wasmModule.ayumi_set_mixer(ayumiPtr, 1, 0, 1, 0);
			wasmModule.ayumi_set_volume(ayumiPtr, 1, 6);
		} else if (type === 'stop') {
			wasmModule.ayumi_set_mixer(ayumiPtr, 0, 0, 0, 0);
			wasmModule.ayumi_set_volume(ayumiPtr, 0, 0);
		}
	}

	process(inputs, outputs, parameters) {
		if (!this.initialized || !wasmModule || !ayumiPtr) {
			return true;
		}

		wasmModule.ayumi_set_mixer(ayumiPtr, 1, 0, 1, 0);
		wasmModule.ayumi_set_volume(ayumiPtr, 1, 6);

		if (outputs.length > 0 && outputs[0].length > 1) {
			const output = outputs[0];
			const leftChannel = output[0];
			const rightChannel = output[1];

			for (let i = 0; i < leftChannel.length; i++) {
				// Update arpeggio step
				this.stepCounter++;
				if (this.stepCounter >= this.stepsPerNote) {
					this.step = (this.step + 1) % this.arpeggioFrequencies.length;
					this.stepCounter = 0;
					const period = Math.floor(1773400 / this.arpeggioFrequencies[this.step] * 100);
					wasmModule.ayumi_set_tone(ayumiPtr, 1, period);
				}

				wasmModule.ayumi_process(ayumiPtr);
				wasmModule.ayumi_remove_dc(ayumiPtr);

				// Calculate correct offsets for left and right fields
				const leftOffset = ayumiPtr + AYUMI_STRUCT_LEFT_OFFSET;
				const rightOffset = ayumiPtr + AYUMI_STRUCT_RIGHT_OFFSET;

				const leftValue = new Float64Array(wasmModule.memory.buffer, leftOffset, 1)[0];
				const rightValue = new Float64Array(wasmModule.memory.buffer, rightOffset, 1)[0];

				leftChannel[i] = leftValue;
				rightChannel[i] = rightValue;
			}
		}
		return true;
	}
}

registerProcessor('ayumi-processor', AyumiProcessor);
