class BinauralGenerator {
    constructor() {
        this.audioContext = null;
        this.oscillatorLeft = null;
        this.oscillatorRight = null;
        this.gainNode = null;
        this.pannerLeft = null;
        this.pannerRight = null;
        this.currentJourney = null;
        this.journeyInterval = null;
        this.volume = 0.05;
        this.isPlaying = false;
        this.isInitialized = false;
        this.activeButton = null;
        this.mode = null; // 'frequency' or 'journey'

        this.frequencies = {
            alpha: [8.4, 10.5, 12.0],    // Bridge to Theta, Mind/Body Integration, Grounding
            theta: [4.5, 5.5, 7.0],      // Deep Meditation, Emotional Processing, Creative Programming
            delta: [1.0, 2.25, 3.5]      // Trauma Release, Healing Sleep, Deep Integration
        };

        this.journeyPresets = {
            habitChange: {
                name: 'Habit Change Journey',
                description: 'Progressive transition through states for habit transformation',
                stages: [
                    { layer: 'alpha', index: 1, duration: 5 * 60 },  // 10.5 Hz - Mind/Body Integration
                    { layer: 'theta', index: 2, duration: 10 * 60 }, // 7.0 Hz - Creative Programming
                    { layer: 'delta', index: 1, duration: 5 * 60 }   // 2.25 Hz - Healing Sleep
                ]
            },
            emotionalHealing: {
                name: 'Emotional Healing',
                description: 'Theta-focused emotional processing and healing',
                stages: [
                    { layer: 'theta', index: 1, duration: 7 * 60 },   // 5.5 Hz - Emotional Processing
                    { layer: 'theta', index: 2, duration: 7 * 60 },   // 7.0 Hz - Creative Programming
                    { layer: 'theta', index: 1, duration: 6 * 60 }    // 5.5 Hz - Final Integration
                ]
            },
            deepSleep: {
                name: 'Deep Sleep Rewiring',
                description: 'Delta-dominant pattern for deep subconscious work',
                stages: [
                    { layer: 'theta', index: 0, duration: 5 * 60 },   // 4.5 Hz - Gentle Transition
                    { layer: 'delta', index: 0, duration: 10 * 60 },  // 1.0 Hz - Trauma Release
                    { layer: 'delta', index: 1, duration: 5 * 60 }    // 2.25 Hz - Healing Sleep
                ]
            }
        };

        // Initialize after user interaction
        document.addEventListener('click', () => {
            if (!this.isInitialized) {
                this.initializeAudioContext();
            }
        }, { once: true });

        this.setupEventListeners();
    }

    initializeAudioContext() {
        if (this.isInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.isInitialized = true;
            console.log('Binaural audio system initialized');
        } catch (error) {
            console.error('Failed to initialize audio system:', error);
        }
    }

    createAudioNodes() {
        // Create oscillators
        this.oscillatorLeft = this.audioContext.createOscillator();
        this.oscillatorRight = this.audioContext.createOscillator();
        
        // Create gain node for volume control
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.volume;
        
        // Create stereo panning
        this.pannerLeft = this.audioContext.createStereoPanner();
        this.pannerRight = this.audioContext.createStereoPanner();
        
        // Set panning values
        this.pannerLeft.pan.value = -1;  // Full left
        this.pannerRight.pan.value = 1;  // Full right
        
        // Connect nodes
        this.oscillatorLeft.connect(this.pannerLeft);
        this.oscillatorRight.connect(this.pannerRight);
        this.pannerLeft.connect(this.gainNode);
        this.pannerRight.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
    }

    async start(baseFreq, targetFreq) {
        if (!this.isInitialized) {
            this.initializeAudioContext();
        }

        if (this.isPlaying) {
            this.stop();
        }

        try {
            this.createAudioNodes();
            
            // Set frequencies
            this.oscillatorLeft.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
            this.oscillatorRight.frequency.setValueAtTime(baseFreq + targetFreq, this.audioContext.currentTime);
            
            // Start oscillators
            this.oscillatorLeft.start();
            this.oscillatorRight.start();
            
            this.isPlaying = true;
            console.log('Started binaural beat:', baseFreq, baseFreq + targetFreq);
        } catch (error) {
            console.error('Error starting binaural beat:', error);
        }
    }

    stop() {
        if (!this.isPlaying) return;
        
        try {
            this.oscillatorLeft?.stop();
            this.oscillatorRight?.stop();
            this.oscillatorLeft = null;
            this.oscillatorRight = null;
            this.isPlaying = false;
            console.log('Stopped binaural beat');
        } catch (error) {
            console.error('Error stopping binaural beat:', error);
        }
    }

    setupEventListeners() {
        // Frequency buttons
        document.querySelectorAll('.freq-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (this.mode === 'frequency' && this.activeButton === btn) {
                    // If clicking the same active button, stop everything
                    this.stop();
                    this.mode = null;
                    this.activeButton = null;
                    return;
                }

                // Stop any current playback
                this.stop();
                if (this.currentJourney) {
                    this.stopJourney();
                }

                // Reset all buttons
                document.querySelectorAll('.freq-btn, .journey-btn').forEach(b => b.classList.remove('active'));

                // Start new frequency
                const layer = btn.dataset.layer;
                const index = parseInt(btn.dataset.index);
                btn.classList.add('active');
                this.mode = 'frequency';
                this.activeButton = btn;
                
                const freq = this.frequencies[layer][index];
                await this.start(200, freq);
            });
        });

        // Journey buttons
        document.querySelectorAll('.journey-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.mode === 'journey' && this.activeButton === btn) {
                    // If clicking the same active button, stop everything
                    this.stopJourney();
                    this.mode = null;
                    this.activeButton = null;
                    return;
                }

                // Stop any current playback
                this.stop();
                if (this.currentJourney) {
                    this.stopJourney();
                }

                // Reset all buttons
                document.querySelectorAll('.freq-btn, .journey-btn').forEach(b => b.classList.remove('active'));

                // Start new journey
                const journey = btn.dataset.journey;
                btn.classList.add('active');
                this.mode = 'journey';
                this.activeButton = btn;
                this.startJourney(journey);
            });
        });
    }

    stopJourney() {
        if (this.journeyInterval) {
            clearInterval(this.journeyInterval);
            this.journeyInterval = null;
        }
        this.stop();
        this.currentJourney = null;
        
        // Reset journey display
        const journeyStatus = document.getElementById('journey-status');
        if (journeyStatus) {
            journeyStatus.style.display = 'none';
        }
    }

    startJourney(journeyName) {
        const journey = this.journeyPresets[journeyName];
        if (!journey) return;
        
        this.stopJourney(); // Stop any existing journey
        
        let currentStageIndex = 0;
        const playStage = async () => {
            if (currentStageIndex >= journey.stages.length) {
                this.stopJourney();
                return;
            }
            
            const stage = journey.stages[currentStageIndex];
            const freq = this.frequencies[stage.layer][stage.index];
            await this.start(200, freq);
            
            currentStageIndex++;
            if (currentStageIndex < journey.stages.length) {
                this.journeyInterval = setTimeout(playStage, stage.duration * 1000);
            }
        };
        
        this.currentJourney = journeyName;
        playStage();
    }

    setVolume(value) {
        this.volume = value;
        if (this.gainNode) {
            this.gainNode.gain.value = value;
        }
    }
}

// Initialize binaural generator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.binauralGenerator = new BinauralGenerator();
});
