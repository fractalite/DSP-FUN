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
        
        // Audio processing
        this.audioContext = null;
        this.voiceEnhancer = null;
        this.sourceNode = null;

        // DOM Elements
        this.recordBtn = document.getElementById('record-btn');
        this.playBtn = document.getElementById('play-btn');
        this.loopBtn = document.getElementById('loop-btn');
        this.recordingTime = document.getElementById('recording-time');
        
        if (this.recordBtn && this.playBtn && this.loopBtn) {
            this.setupEventListeners();
        } else {
            console.warn('Some voice recording controls are missing from the DOM');
        }
    }

    async setupEventListeners() {
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
            this.isLooping = !this.isLooping;
            this.loopBtn.classList.toggle('active');
            if (this.isLooping && !this.isPlaying) {
                this.startPlayback();
            }
        });

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

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            
            this.mediaRecorder.addEventListener('dataavailable', (event) => {
                this.audioChunks.push(event.data);
            });

            this.mediaRecorder.addEventListener('stop', () => {
                this.audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.audioUrl = URL.createObjectURL(this.audioBlob);
                this.audio.src = this.audioUrl;
                
                if (this.playBtn) this.playBtn.disabled = false;
                if (this.loopBtn) this.loopBtn.disabled = false;
                if (this.recordBtn) this.recordBtn.textContent = 'Record';
            });

            this.mediaRecorder.start();
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            this.startTimer();
            
            if (this.recordBtn) {
                this.recordBtn.textContent = 'Stop';
            }
            if (this.playBtn) {
                this.playBtn.disabled = true;
            }
            if (this.loopBtn) {
                this.loopBtn.disabled = true;
            }
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Unable to access microphone. Please check permissions.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.isRecording = false;
            this.stopTimer();
        }
    }

    startPlayback() {
        if (this.audioUrl) {
            this.audio.play();
            this.isPlaying = true;
            if (this.playBtn) {
                this.playBtn.textContent = 'Stop';
            }
        }
    }

    stopPlayback() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
        if (this.playBtn) {
            this.playBtn.textContent = 'Play';
        }
    }

    startTimer() {
        this.recordingTimer = setInterval(() => {
            const duration = Date.now() - this.recordingStartTime;
            const seconds = Math.floor(duration / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            if (this.recordingTime) {
                this.recordingTime.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    stopTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    setVolume(value) {
        this.audio.volume = value;
    }
}

// Initialize voice recorder when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.voiceRecorder = new VoiceRecorder();
});
