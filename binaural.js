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

        this.setupEventListeners();
        this.setupModal();
    }

    initializeContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    initialize() {
        this.initializeContext();
        
        // Create new oscillators and gain node
        this.oscillatorLeft = this.audioContext.createOscillator();
        this.oscillatorRight = this.audioContext.createOscillator();
        this.gainNode = this.audioContext.createGain();

        // Create stereo panners
        this.pannerLeft = this.audioContext.createStereoPanner();
        this.pannerRight = this.audioContext.createStereoPanner();

        // Set pan values
        this.pannerLeft.pan.value = -1;  // Full left
        this.pannerRight.pan.value = 1;   // Full right

        // Connect nodes
        this.oscillatorLeft.connect(this.pannerLeft);
        this.oscillatorRight.connect(this.pannerRight);
        this.pannerLeft.connect(this.gainNode);
        this.pannerRight.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);

        // Set initial volume
        this.setVolume(this.volume);
        
        this.isInitialized = true;
    }

    setupEventListeners() {
        document.addEventListener('click', () => {
            if (!this.isInitialized) {
                this.initialize();
            }
        }, { once: true });

        document.querySelectorAll('.freq-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const layer = btn.dataset.layer;
                const index = parseInt(btn.dataset.index);
                
                if (btn.classList.contains('active')) {
                    btn.classList.remove('active');
                    this.stop();
                } else {
                    // Stop any active journey when starting a frequency
                    document.querySelectorAll('.journey-btn.active').forEach(b => {
                        b.classList.remove('active');
                        this.stopJourney();
                    });
                    
                    btn.classList.add('active');
                    this.setFrequency(layer, index);
                }
            });
        });

        document.querySelectorAll('.journey-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const journey = btn.dataset.journey;
                
                if (btn.classList.contains('active')) {
                    btn.classList.remove('active');
                    this.stopJourney();  // Clean up journey state
                    this.stop();         // Stop the audio
                } else {
                    btn.classList.add('active');
                    this.startJourney(journey);
                }
            });
        });

        // Add Stop All button handler
        document.getElementById('stop-all').addEventListener('click', () => {
            // Stop any active journey
            this.stopJourney();
            // Stop any playing audio
            this.stop();
            // Remove active state from all buttons
            document.querySelectorAll('.freq-btn.active, .journey-btn.active').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Stop voice recorder if it's active
            if (window.voiceRecorder) {
                if (window.voiceRecorder.isRecording) {
                    window.voiceRecorder.stopRecording();
                }
                if (window.voiceRecorder.isPlaying) {
                    window.voiceRecorder.stopPlayback();
                }
            }

            // Stop background music if it's playing
            const audioPlayer = document.querySelector('audio');
            if (audioPlayer) {
                audioPlayer.pause();
                audioPlayer.currentTime = 0;
                const playPauseBtn = document.getElementById('play-pause');
                if (playPauseBtn) {
                    playPauseBtn.textContent = 'Play';
                }
                // Reset loop button state
                const loopBtn = document.getElementById('loop');
                if (loopBtn) {
                    loopBtn.classList.remove('active');
                }
            }
            
            // Stop any active session
            if (window.sessionManager && window.sessionManager.currentSession) {
                window.sessionManager.stopSession();
            }

            // Reset play/pause button states
            const playPauseBtn = document.getElementById('play-pause');
            if (playPauseBtn) {
                playPauseBtn.textContent = 'Play';
            }
        });
    }

    setupModal() {
        const modal = document.getElementById('help-modal');
        const helpIcon = document.getElementById('help-icon');
        const closeBtn = modal.querySelector('.close');

        helpIcon.addEventListener('click', () => {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.style.display === 'block') {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }

    updateActiveButton(clickedBtn) {
        // Only update journey buttons as a group
        if (clickedBtn.classList.contains('journey-btn')) {
            const group = clickedBtn.closest('.preset-buttons');
            group.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            clickedBtn.classList.add('active');
        }
    }

    setFrequency(layer, index) {
        if (!this.isInitialized) {
            this.initialize();
        }

        if (!this.isPlaying) {
            this.start();
        }

        const baseFreq = 200; // Carrier frequency
        const targetFreq = this.frequencies[layer][index];
        
        console.log(`Setting frequency: ${targetFreq} Hz`);

        this.oscillatorLeft.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
        this.oscillatorRight.frequency.setValueAtTime(baseFreq + targetFreq, this.audioContext.currentTime);

        document.getElementById('frequency-display').querySelector('span').textContent = `${targetFreq} Hz`;
    }

    setVolume(value) {
        this.volume = value;
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

    startJourney(journeyName) {
        this.stopJourney();
        
        const journey = this.journeyPresets[journeyName];
        if (!journey) return;

        this.currentJourney = {
            preset: journey,
            currentStageIndex: 0,
            startTime: Date.now()
        };

        const journeyStatus = document.getElementById('journey-status');
        journeyStatus.style.display = 'block';
        
        // Start first stage
        const firstStage = journey.stages[0];
        this.setFrequency(firstStage.layer, firstStage.index);

        // Update progress every second
        this.journeyInterval = setInterval(() => this.updateJourneyProgress(), 1000);
    }

    stopJourney() {
        if (this.journeyInterval) {
            clearInterval(this.journeyInterval);
            this.journeyInterval = null;
        }
        
        this.stop();
        this.currentJourney = null;
        document.getElementById('journey-status').style.display = 'none';
    }

    updateJourneyProgress() {
        if (!this.currentJourney) return;

        const journey = this.currentJourney;
        const elapsed = (Date.now() - journey.startTime) / 1000;
        
        let totalDuration = 0;
        let currentStageStart = 0;
        
        for (let i = 0; i < journey.preset.stages.length; i++) {
            const stageDuration = journey.preset.stages[i].duration;
            totalDuration += stageDuration;
            
            if (elapsed < currentStageStart + stageDuration) {
                if (i !== journey.currentStageIndex) {
                    journey.currentStageIndex = i;
                    const stage = journey.preset.stages[i];
                    this.setFrequency(stage.layer, stage.index);
                }
                break;
            }
            currentStageStart += stageDuration;
        }

        const progress = Math.min(100, (elapsed / totalDuration) * 100);
        document.querySelector('#journey-status span').textContent = `${Math.round(progress)}%`;
        document.querySelector('.journey-progress-bar .progress').style.width = `${progress}%`;

        if (progress >= 100) {
            this.stopJourney();
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.binauralGenerator = new BinauralGenerator();
});
