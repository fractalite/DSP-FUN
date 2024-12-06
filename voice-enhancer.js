class VoiceEnhancer {
    constructor(audioContext) {
        this.audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
        this.setupNodes();
    }

    setupNodes() {
        try {
            // Compressor for evening out volume levels
            this.compressor = this.audioContext.createDynamicsCompressor();
            this.compressor.threshold.value = -24;
            this.compressor.knee.value = 30;
            this.compressor.ratio.value = 12;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;

            // Low-pass filter to remove high frequencies
            this.lowPass = this.audioContext.createBiquadFilter();
            this.lowPass.type = 'lowpass';
            this.lowPass.frequency.value = 3500;
            this.lowPass.Q.value = 0.5;

            // Reverb for spatial presence
            this.reverb = this.audioContext.createConvolver();
            this.createReverbImpulse();

            // Gain nodes for mixing
            this.inputGain = this.audioContext.createGain();
            this.outputGain = this.audioContext.createGain();
            this.reverbGain = this.audioContext.createGain();
            this.dryGain = this.audioContext.createGain();

            // Set initial gain values
            this.inputGain.gain.value = 1.0;
            this.outputGain.gain.value = 1.0;
            this.reverbGain.gain.value = 0.1; // 10% wet
            this.dryGain.gain.value = 0.9;    // 90% dry

            // Connect the nodes
            this.inputGain.connect(this.lowPass);
            this.lowPass.connect(this.compressor);
            
            // Parallel paths for dry/wet
            this.compressor.connect(this.dryGain);
            this.compressor.connect(this.reverb);
            this.reverb.connect(this.reverbGain);
            
            // Final mixing
            this.dryGain.connect(this.outputGain);
            this.reverbGain.connect(this.outputGain);

        } catch (error) {
            console.error('Error setting up audio nodes:', error);
        }
    }

    createReverbImpulse() {
        try {
            const sampleRate = this.audioContext.sampleRate;
            const length = sampleRate * 2; // 2 seconds
            const impulse = this.audioContext.createBuffer(2, length, sampleRate);
            
            for (let channel = 0; channel < 2; channel++) {
                const channelData = impulse.getChannelData(channel);
                for (let i = 0; i < length; i++) {
                    const t = i / sampleRate;
                    // Exponential decay
                    channelData[i] = (Math.random() * 2 - 1) * Math.exp(-5 * t);
                }
            }
            
            this.reverb.buffer = impulse;
        } catch (error) {
            console.error('Error creating reverb impulse:', error);
        }
    }

    connect(source) {
        try {
            source.connect(this.inputGain);
            return this.outputGain;
        } catch (error) {
            console.error('Error connecting audio source:', error);
            return source;
        }
    }

    setReverbLevel(value) {
        try {
            // value: 0 to 1
            this.reverbGain.gain.value = value * 0.3; // Max 30% wet
            this.dryGain.gain.value = 1 - (value * 0.3); // Compensate dry
        } catch (error) {
            console.error('Error setting reverb level:', error);
        }
    }

    setCompression(value) {
        try {
            // value: 0 to 1
            this.compressor.threshold.value = -24 - (value * 24); // -24dB to -48dB
            this.compressor.ratio.value = 4 + (value * 8); // 4:1 to 12:1
        } catch (error) {
            console.error('Error setting compression:', error);
        }
    }

    setLowPassFrequency(value) {
        try {
            // value: 0 to 1
            this.lowPass.frequency.value = 2000 + (value * 2000); // 2kHz to 4kHz
        } catch (error) {
            console.error('Error setting low-pass frequency:', error);
        }
    }

    setInputGain(value) {
        try {
            // value: 0 to 1
            this.inputGain.gain.value = value;
        } catch (error) {
            console.error('Error setting input gain:', error);
        }
    }

    setOutputGain(value) {
        try {
            // value: 0 to 1
            this.outputGain.gain.value = value;
        } catch (error) {
            console.error('Error setting output gain:', error);
        }
    }

    dispose() {
        try {
            this.outputGain.disconnect();
            this.inputGain.disconnect();
            this.compressor.disconnect();
            this.reverb.disconnect();
            this.lowPass.disconnect();
            this.reverbGain.disconnect();
            this.dryGain.disconnect();
        } catch (error) {
            console.error('Error disposing audio nodes:', error);
        }
    }
}
