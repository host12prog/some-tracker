const AYUMI_STRUCT_SIZE = 22904;
const AYUMI_STRUCT_LEFT_OFFSET = AYUMI_STRUCT_SIZE - 16;
const AYUMI_STRUCT_RIGHT_OFFSET = AYUMI_STRUCT_SIZE - 8;

let wasmModule = null;
let ayumiPtr = null;
let currentPattern = null;
let currentOrder = null;
let currentRowIndex = 0;
let currentTuningTable = [];

let patternOrder = [];
let currentPatternOrderIndex = 0;

let sampleRate = 44100;
let songHz = 50;
let samplesPerTick = 0;
let sampleCounter = 0;
let currentRow = 0;
let currentTick = 0;
let currentSpeed = 3;

let channelVolumes = [15, 15, 15];

class AyumiProcessor extends AudioWorkletProcessor {
	constructor() {
		super();
		this.initialized = false;
		this.port.onmessage = this.handleMessage.bind(this);
	}

	async handleMessage(event) {
		const {
			type,
			pattern,
			wasmBuffer,
			initialSpeed,
			patternOrderData,
			startPatternOrderIndex
		} = event.data;

		if (type === 'init' && wasmBuffer && !wasmModule) {
			try {
				const result = await WebAssembly.instantiate(wasmBuffer, {
					env: {
						emscripten_notify_memory_growth: () => {}
					}
				});

				wasmModule = result.instance.exports;

				ayumiPtr = wasmModule.malloc(AYUMI_STRUCT_SIZE);

				wasmModule.ayumi_configure(ayumiPtr, 0, 1773400, 44100);
				wasmModule.ayumi_set_pan(ayumiPtr, 0, 0.35, 0);
				wasmModule.ayumi_set_pan(ayumiPtr, 1, 0.5, 0);
				wasmModule.ayumi_set_pan(ayumiPtr, 2, 0.75, 0);

				samplesPerTick = Math.floor(sampleRate / songHz);

				this.initialized = true;
			} catch (error) {
				console.error('Failed to initialize Ayumi:', error);
			}
		} else if (type === 'play' && wasmModule && this.initialized) {
			wasmModule.ayumi_set_mixer(ayumiPtr, 0, 1, 1, 0);
			wasmModule.ayumi_set_mixer(ayumiPtr, 1, 1, 1, 0);
			wasmModule.ayumi_set_mixer(ayumiPtr, 2, 1, 1, 0);

			sampleCounter = 0;
			currentRow = 0;
			currentTick = 0;
			channelVolumes = [0, 0, 0];

			if (startPatternOrderIndex !== undefined) {
				currentPatternOrderIndex = startPatternOrderIndex;
			}

			if (initialSpeed !== undefined) {
				currentSpeed = initialSpeed;
			}
		} else if (type === 'stop') {
			wasmModule.ayumi_set_mixer(ayumiPtr, 0, 1, 1, 0);
			wasmModule.ayumi_set_mixer(ayumiPtr, 1, 1, 1, 0);
			wasmModule.ayumi_set_mixer(ayumiPtr, 2, 1, 1, 0);
			wasmModule.ayumi_set_volume(ayumiPtr, 0, 0);
			wasmModule.ayumi_set_volume(ayumiPtr, 1, 0);
			wasmModule.ayumi_set_volume(ayumiPtr, 2, 0);
			channelVolumes = [0, 0, 0];
			sampleCounter = 0;
			currentRow = 0;
			currentTick = 0;
		} else if (type === 'set_pattern_data') {
			currentPattern = pattern;
		} else if (type === 'set_pattern_order') {
			patternOrder = patternOrderData || [];
		} else if (type === 'set_tuning_table') {
			currentTuningTable = event.data.tuningTable || [];
			console.log('Tuning table set:', currentTuningTable);
		}
	}

	parsePatternRow(pattern, rowIndex) {
		if (!pattern || rowIndex >= pattern.length || rowIndex < 0) return;

		const patternRow = pattern.patternRows[rowIndex];
		if (!patternRow) return;

		for (let channelIndex = 0; channelIndex < pattern.channels.length; channelIndex++) {
			const channel = pattern.channels[channelIndex];
			const row = channel.rows[rowIndex];

			if (row.note.name === 1) {
				wasmModule.ayumi_set_tone(ayumiPtr, channelIndex, 0);
			} else if (row.note.name !== 0) {
				// NoteName enum starts at 2 for C, so subtract 2 to get correct semitone offset
				const noteValue = row.note.name - 2 + (row.note.octave - 1) * 12;

				if (noteValue >= 0 && noteValue < currentTuningTable.length) {
					const regValue = currentTuningTable[noteValue];
					wasmModule.ayumi_set_tone(ayumiPtr, channelIndex, regValue);
				}
			}

			//replace with proper parsing when instruments will be implemented
			wasmModule.ayumi_set_mixer(ayumiPtr, 0, 0, 1, 0);
			wasmModule.ayumi_set_mixer(ayumiPtr, 1, 0, 1, 0);
			wasmModule.ayumi_set_mixer(ayumiPtr, 2, 0, 1, 0);

			if (row.volume > 0) {
				wasmModule.ayumi_set_volume(ayumiPtr, channelIndex, row.volume);
				channelVolumes[channelIndex] = row.volume;
			} else {
				wasmModule.ayumi_set_volume(ayumiPtr, channelIndex, channelVolumes[channelIndex]);
			}

			if (patternRow.noiseValue > 0) {
				wasmModule.ayumi_set_noise(ayumiPtr, patternRow.noiseValue);
			}

			if (patternRow.envelopeValue > 0) {
				wasmModule.ayumi_set_envelope(ayumiPtr, patternRow.envelopeValue);
			}

			// Check for speed effect (Effect type 5 - ehhh change it later..)
			if (row.effects[0] && row.effects[0].effect === 5) {
				const newSpeed = row.effects[0].parameter;
				if (newSpeed > 0) {
					currentSpeed = newSpeed;
				}
			}
		}
	}

	process(inputs, outputs, parameters) {
		if (!this.initialized || !wasmModule || !ayumiPtr) {
			return true;
		}

		if (outputs.length > 0 && outputs[0].length > 1) {
			const output = outputs[0];
			const leftChannel = output[0];
			const rightChannel = output[1];
			const numSamples = leftChannel.length;

			for (let i = 0; i < numSamples; i++) {
				if (
					currentPattern &&
					currentPattern.length > 0 &&
					sampleCounter >= samplesPerTick
				) {
					// start of new row
					if (currentTick === 0) {
						this.parsePatternRow(currentPattern, currentRow);

						this.port.postMessage({
							type: 'position_update',
							currentRow: currentRow,
							currentTick: currentTick,
							currentPatternOrderIndex: currentPatternOrderIndex
						});
					}

					currentTick++;
					if (currentTick >= currentSpeed) {
						currentTick = 0;
						currentRow++;
						if (currentRow >= currentPattern.length) {
							currentRow = 0;
							console.log(
								`End of pattern reached. Current order: ${currentPatternOrderIndex}`
							);

							// Advance to next pattern in order
							currentPatternOrderIndex++;
							if (currentPatternOrderIndex >= patternOrder.length) {
								// Loop back to beginning
								currentPatternOrderIndex = 0;
							}

							// request the next pattern
							console.log(`Requesting pattern for order ${currentPatternOrderIndex}`);
							this.port.postMessage({
								type: 'request_pattern',
								patternOrderIndex: currentPatternOrderIndex
							});
						}
					}

					sampleCounter = 0;
				}

				wasmModule.ayumi_process(ayumiPtr);
				wasmModule.ayumi_remove_dc(ayumiPtr);

				const leftOffset = ayumiPtr + AYUMI_STRUCT_LEFT_OFFSET;
				const rightOffset = ayumiPtr + AYUMI_STRUCT_RIGHT_OFFSET;

				const leftValue = new Float64Array(wasmModule.memory.buffer, leftOffset, 1)[0];
				const rightValue = new Float64Array(wasmModule.memory.buffer, rightOffset, 1)[0];

				leftChannel[i] = leftValue;
				rightChannel[i] = rightValue;

				sampleCounter++;
			}
		}
		return true;
	}
}

registerProcessor('ayumi-processor', AyumiProcessor);
