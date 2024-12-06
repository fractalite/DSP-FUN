class BinauralGenerator {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.oscillatorLeft = null;
        this.oscillatorRight = null;
        this.gainNode = null;
        this.currentFrequency = 10; // Default to Alpha
        this.isPlaying = false;
    }

    initialize() {
        this.oscillatorLeft = this.audioContext.createOscillator();
        this.oscillatorRight = this.audioContext.createOscillator();
        this.gainNode = this.audioContext.createGain();

        // Create stereo panner for left and right channels
        this.pannerLeft = this.audioContext.createStereoPanner();
        this.pannerRight = this.audioContext.createStereoPanner();

        this.pannerLeft.pan.value = -1; // Full left
        this.pannerRight.pan.value = 1;  // Full right

        // Connect nodes
        this.oscillatorLeft.connect(this.pannerLeft);
        this.oscillatorRight.connect(this.pannerRight);
        this.pannerLeft.connect(this.gainNode);
        this.pannerRight.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);

        // Set initial volume
        this.setVolume(0.3); // 30%
    }

    setFrequencyRange(range) {
        if (!this.oscillatorLeft || !this.oscillatorRight) return;

        let baseFreq = 200; // Carrier frequency
        let targetFreq;

        switch(range) {
            case 'delta':
                targetFreq = 2; // Middle of delta range
                break;
            case 'theta':
                targetFreq = 6; // Middle of theta range
                break;
            case 'alpha':
                targetFreq = 10; // Middle of alpha range
                break;
            default:
                targetFreq = 10;
        }

        this.currentFrequency = targetFreq;
        this.oscillatorLeft.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
        this.oscillatorRight.frequency.setValueAtTime(baseFreq + targetFreq, this.audioContext.currentTime);
    }

    setVolume(value) {
        if (this.gainNode) {
            this.gainNode.gain.setValueAtTime(value, this.audioContext.currentTime);
        }
    }

    start() {
        if (this.isPlaying) return;
        
        this.initialize();
        this.oscillatorLeft.start();
        this.oscillatorRight.start();
        this.isPlaying = true;
    }

    stop() {
        if (!this.isPlaying) return;

        this.oscillatorLeft.stop();
        this.oscillatorRight.stop();
        this.isPlaying = false;
        this.oscillatorLeft = null;
        this.oscillatorRight = null;
    }

    getCurrentFrequency() {
        return this.currentFrequency;
    }
}
