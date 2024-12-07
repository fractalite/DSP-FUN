import { VoiceEnhancer } from './voice-enhancer.js';

class VoiceRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioBlob = null;
        this.audioUrl = null;
        this.audio = new Audio();
        this.isRecording = false;
        this.isPlaying = false;
        this.isLooping = false;
        this.recordingStartTime = null;
        this.recordingTimer = null;
        
        this.audioContext = null;
        this.voiceEnhancer = null;
        this.sourceNode = null;
        this.destinationNode = null;
        this.isInitialized = false;

        // DOM Elements
        this.recordBtn = document.getElementById('record-btn');
        this.playBtn = document.getElementById('play-btn');
        this.loopBtn = document.getElementById('loop-btn');
        this.recordingTime = document.getElementById('recording-time');
        this.volumeControl = document.getElementById('voice-volume');

        // Initialize after user interaction
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.initializeAudioContext();
            }
        }, { once: true });

        if (this.recordBtn && this.playBtn && this.loopBtn) {
            this.setupEventListeners();
        } else {
            console.warn('Some voice recording controls are missing from the DOM');
        }
    }

    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.voiceEnhancer = new VoiceEnhancer(this.audioContext);
            console.log('AudioContext and VoiceEnhancer initialized');
        } catch (error) {
            console.error('Failed to initialize audio system:', error);
        }
    }

    setupEventListeners() {
        // Record button
        this.recordBtn.addEventListener('click', () => {
            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        });

        // Play button
        this.playBtn.addEventListener('click', () => {
            if (this.isPlaying) {
                this.stopPlayback();
            } else {
                this.startPlayback();
            }
        });

        // Loop button
        this.loopBtn.addEventListener('click', () => {
            if (!this.audioUrl) return;
            
            this.audio.loop = !this.audio.loop;
            this.isLooping = this.audio.loop;
            this.loopBtn.classList.toggle('active');
            
            if (this.isLooping && !this.isPlaying) {
                this.startPlayback();
            }
        });

        // Volume control
        if (this.volumeControl) {
            this.volumeControl.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                this.audio.volume = volume;
                e.target.nextElementSibling.textContent = `${e.target.value}%`;
            });
        }

        // Audio ended event
        this.audio.addEventListener('ended', () => {
            if (this.isLooping) {
                this.audio.currentTime = 0;
                this.audio.play();
            } else {
                this.stopPlayback();
            }
        });
    }

    updateRecordingTime() {
        if (!this.recordingStartTime) return;
        
        const now = Date.now();
        const diff = now - this.recordingStartTime;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        
        const displayMinutes = String(minutes).padStart(2, '0');
        const displaySeconds = String(seconds % 60).padStart(2, '0');
        
        if (this.recordingTime) {
            this.recordingTime.textContent = `${displayMinutes}:${displaySeconds}`;
        }
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Set up audio processing chain
            this.sourceNode = this.audioContext.createMediaStreamSource(stream);
            this.destinationNode = this.audioContext.createMediaStreamDestination();
            
            // Connect through voice enhancer
            const enhancedOutput = this.voiceEnhancer.connect(this.sourceNode);
            enhancedOutput.connect(this.destinationNode);

            // Create MediaRecorder with processed audio
            this.mediaRecorder = new MediaRecorder(this.destinationNode.stream);
            this.audioChunks = [];
            
            this.mediaRecorder.addEventListener('dataavailable', (event) => {
                this.audioChunks.push(event.data);
            });

            this.mediaRecorder.addEventListener('stop', () => {
                this.audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.audioUrl = URL.createObjectURL(this.audioBlob);
                this.audio.src = this.audioUrl;
                
                if (this.playBtn) {
                    this.playBtn.disabled = false;
                    this.playBtn.classList.remove('active');
                }
                if (this.loopBtn) {
                    this.loopBtn.disabled = false;
                    this.loopBtn.classList.remove('active');
                    this.isLooping = false;
                }
            });

            this.mediaRecorder.start();
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            this.recordingTimer = setInterval(() => this.updateRecordingTime(), 1000);
            
            if (this.recordBtn) {
                this.recordBtn.classList.add('recording');
                this.recordBtn.textContent = 'Stop Recording';
            }
            
            if (this.playBtn) this.playBtn.disabled = true;
            if (this.loopBtn) this.loopBtn.disabled = true;
            
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not access microphone. Please ensure you have granted microphone permissions.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            clearInterval(this.recordingTimer);
            
            if (this.recordBtn) {
                this.recordBtn.classList.remove('recording');
                this.recordBtn.textContent = 'Record';
            }
            
            // Clean up audio nodes
            if (this.sourceNode) {
                this.sourceNode.disconnect();
            }
            
            // Stop all tracks
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    }

    startPlayback() {
        if (this.audioUrl) {
            this.audio.play();
            this.isPlaying = true;
            if (this.playBtn) {
                this.playBtn.textContent = 'Stop';
                this.playBtn.classList.add('active');
            }
        }
    }

    stopPlayback() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
        if (this.playBtn) {
            this.playBtn.textContent = 'Play';
            this.playBtn.classList.remove('active');
        }
    }
}

// Initialize voice recorder when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.voiceRecorder = new VoiceRecorder();
});

export default VoiceRecorder;