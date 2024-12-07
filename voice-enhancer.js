export class VoiceEnhancer {
    constructor(audioContext) {
        this.audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
        this.setupNodes();
    }

    setupNodes() {
        try {
            // Only using a simple gain node for now
            this.outputGain = this.audioContext.createGain();
            this.outputGain.gain.value = 1.0;
        } catch (error) {
            console.error('Error setting up audio nodes:', error);
        }
    }

    connect(source) {
        try {
            source.connect(this.outputGain);
            return this.outputGain;
        } catch (error) {
            console.error('Error connecting audio source:', error);
            return source;
        }
    }

    setOutputGain(value) {
        try {
            this.outputGain.gain.value = value;
        } catch (error) {
            console.error('Error setting output gain:', error);
        }
    }

    dispose() {
        try {
            this.outputGain.disconnect();
        } catch (error) {
            console.error('Error disposing audio nodes:', error);
        }
    }
}