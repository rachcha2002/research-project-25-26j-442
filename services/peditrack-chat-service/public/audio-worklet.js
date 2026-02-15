/**
 * Robust Audio Worklet for Gemini Live API
 * Handles resampling to 16kHz internally to ensure consistent output format.
 * Disables aggressively VAD (Voice Activity Detection) to prevents speech cutting.
 */

class AudioRecorderWorklet extends AudioWorkletProcessor {
    constructor() {
        super();
        
        this.targetSampleRate = 16000;
        this.bufferSize = 640; // Send chunks of ~40ms (at 16kHz)
        
        // Resampling state
        this.buffer = new Float32Array(this.bufferSize);
        this.bufferIndex = 0;
        this.resampleRatio = sampleRate / this.targetSampleRate;
        this.resamplePhase = 0; // For linear interpolation
        
        console.log(`[AudioWorklet] Input: ${sampleRate}Hz, Target: ${this.targetSampleRate}Hz, Ratio: ${this.resampleRatio}`);
    }

    process(inputs) {
        const input = inputs[0];
        if (!input || input.length === 0) return true;
        
        const channelData = input[0];
        
        // Optimization: If sample rates match (e.g. 16k -> 16k), fast path
        if (sampleRate === this.targetSampleRate) {
            this.processPassthrough(channelData);
        } else {
            this.processResampled(channelData);
        }
        
        return true;
    }
    
    processPassthrough(inputData) {
        // Simple ring buffer or just simple chunking
        for (let i = 0; i < inputData.length; i++) {
            this.buffer[this.bufferIndex++] = inputData[i];
            if (this.bufferIndex >= this.bufferSize) {
                this.flush();
            }
        }
    }
    
    processResampled(inputData) {
        // Linear Interpolation Resampling
        // Good balance of quality vs performance for speech
        // More importantly: It's STATEFUL (maintains phase between chunks)
        // so no clicks/pops at chunk boundaries.
        
        let i = 0; // output index (virtual)
        
        // We process the input buffer
        // this.resamplePhase tracks where we are "between" input samples
        
        while (this.resamplePhase < inputData.length) {
            const index = Math.floor(this.resamplePhase);
            const frac = this.resamplePhase - index;
            
            // Get current and next sample for interpolation
            // If next is out of bounds, effectively duplicate (or we'd need input history... 
            // but for streaming, dropping the last fraction of a sample is acceptable jitter)
            const s0 = inputData[index];
            const s1 = (index + 1 < inputData.length) ? inputData[index + 1] : s0;
            
            // Linear interpolate
            const sample = s0 + frac * (s1 - s0);
            
            this.buffer[this.bufferIndex++] = sample;
            
            // Advance phase
            this.resamplePhase += this.resampleRatio;
            
            // Flush if full
            if (this.bufferIndex >= this.bufferSize) {
                this.flush();
            }
        }
        
        // Wrap around phase for next chunk
        this.resamplePhase -= inputData.length;
    }
    
    flush() {
        // Send data to main thread
        // We calculate RMS here for visualization ONLY
        const rms = this.calculateRMS(this.buffer);
        
        // Copy buffer to send
        const audioData = new Float32Array(this.buffer);
        
        this.port.postMessage({
            type: 'audio',
            data: audioData.buffer,
            rms: rms
        }, [audioData.buffer]);
        
        this.bufferIndex = 0;
        this.buffer = new Float32Array(this.bufferSize);
    }
    
    calculateRMS(samples) {
        let sum = 0;
        for (let i = 0; i < samples.length; i++) {
            sum += samples[i] * samples[i];
        }
        return Math.sqrt(sum / samples.length);
    }
}

registerProcessor('audio-recorder-worklet', AudioRecorderWorklet);
