document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    const binauralGenerator = new BinauralGenerator();
    let audioPlayer = new Audio();
    let mediaRecorder = null;
    let audioChunks = [];
    let recordedAudio = null;
    let sessionTimer = null;
    
    // Populate track selector
    const trackSelector = document.getElementById('track-selector');
    Object.entries(audioTracks).forEach(([key, track]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = track.name;
        trackSelector.appendChild(option);
    });

    // Volume controls
    const musicVolume = document.getElementById('music-volume');
    const binauralVolume = document.getElementById('binaural-volume');
    const voiceVolume = document.getElementById('voice-volume');

    musicVolume.addEventListener('input', (e) => {
        audioPlayer.volume = e.target.value / 100;
        updateVolumeDisplay(e.target);
    });

    binauralVolume.addEventListener('input', (e) => {
        binauralGenerator.setVolume(e.target.value / 100);
        updateVolumeDisplay(e.target);
    });

    voiceVolume.addEventListener('input', (e) => {
        if (recordedAudio) {
            recordedAudio.volume = e.target.value / 100;
        }
        updateVolumeDisplay(e.target);
    });

    function updateVolumeDisplay(slider) {
        slider.nextElementSibling.textContent = `${slider.value}%`;
    }

    // Track selection and playback
    trackSelector.addEventListener('change', () => {
        const selectedTrack = audioTracks[trackSelector.value];
        if (selectedTrack) {
            audioPlayer.src = selectedTrack.versionA;
            audioPlayer.load();
        }
    });

    // Play/Pause control
    const playPauseBtn = document.getElementById('play-pause');
    playPauseBtn.addEventListener('click', () => {
        if (audioPlayer.paused) {
            audioPlayer.play();
            playPauseBtn.textContent = 'Pause';
        } else {
            audioPlayer.pause();
            playPauseBtn.textContent = 'Play';
        }
    });

    // Loop control
    const loopBtn = document.getElementById('loop');
    loopBtn.addEventListener('click', () => {
        audioPlayer.loop = !audioPlayer.loop;
        loopBtn.style.backgroundColor = audioPlayer.loop ? 'var(--hover-color)' : 'var(--accent-color)';
    });

    // Frequency controls
    document.querySelectorAll('.freq-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const freq = btn.dataset.freq;
            document.querySelectorAll('.freq-btn').forEach(b => 
                b.style.backgroundColor = 'var(--accent-color)');
            btn.style.backgroundColor = 'var(--hover-color)';
            binauralGenerator.setFrequencyRange(freq);
            updateFrequencyDisplay();
        });
    });

    function updateFrequencyDisplay() {
        const display = document.querySelector('#frequency-display span');
        display.textContent = `${binauralGenerator.getCurrentFrequency()} Hz`;
    }

    // Voice recording
    const recordBtn = document.getElementById('record');
    const playRecordingBtn = document.getElementById('play-recording');

    recordBtn.addEventListener('click', async () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            recordBtn.textContent = 'Record';
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener('stop', () => {
                const audioBlob = new Blob(audioChunks);
                recordedAudio = new Audio(URL.createObjectURL(audioBlob));
                recordedAudio.volume = voiceVolume.value / 100;
                playRecordingBtn.disabled = false;
            });

            mediaRecorder.start();
            recordBtn.textContent = 'Stop Recording';
            playRecordingBtn.disabled = true;
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Unable to access microphone. Please check permissions.');
        }
    });

    playRecordingBtn.addEventListener('click', () => {
        if (recordedAudio) {
            if (recordedAudio.paused) {
                recordedAudio.play();
                playRecordingBtn.textContent = 'Stop';
            } else {
                recordedAudio.pause();
                recordedAudio.currentTime = 0;
                playRecordingBtn.textContent = 'Play';
            }
        }
    });

    // AI Script Generation
    const intentionInput = document.getElementById('intention-input');
    const generateBtn = document.getElementById('generate-script');
    const affirmationsArea = document.getElementById('affirmations-area');

    generateBtn.addEventListener('click', () => {
        const intention = intentionInput.value.trim();
        if (!intention) return;

        // Simple affirmation generation logic
        const affirmations = generateAffirmations(intention);
        affirmationsArea.value = affirmations.join('\n');
    });

    function generateAffirmations(intention) {
        const templates = [
            "I am naturally and easily [goal]",
            "Every day, I [goal] with increasing ease",
            "I choose to [goal] and it feels wonderful",
            "I am grateful that I am now [goal]",
            "I deserve to [goal] and I accept this truth"
        ];

        return templates.map(template => {
            return template.replace('[goal]', intention.toLowerCase());
        });
    }

    // Volume Presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            applyVolumePreset(preset);
        });
    });

    function applyVolumePreset(preset) {
        switch(preset) {
            case 'meditation':
                musicVolume.value = 60;
                binauralVolume.value = 30;
                voiceVolume.value = 100;
                break;
            case 'sleep':
                musicVolume.value = 40;
                binauralVolume.value = 50;
                voiceVolume.value = 0;
                break;
            case 'affirmation':
                musicVolume.value = 40;
                binauralVolume.value = 30;
                voiceVolume.value = 100;
                break;
        }

        // Update all volume displays and actual volumes
        [musicVolume, binauralVolume, voiceVolume].forEach(slider => {
            updateVolumeDisplay(slider);
            slider.dispatchEvent(new Event('input'));
        });
    }

    // Session Timer
    const sessionTimerSlider = document.getElementById('session-timer');
    const timerDisplay = document.getElementById('timer-display');
    const progressBar = document.getElementById('progress-bar');
    let sessionDuration = 20 * 60; // Default 20 minutes in seconds
    let timeRemaining = sessionDuration;
    let isSessionActive = false;

    sessionTimerSlider.addEventListener('input', () => {
        sessionDuration = sessionTimerSlider.value * 60;
        timeRemaining = sessionDuration;
        updateTimerDisplay();
    });

    function updateTimerDisplay() {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const progress = ((sessionDuration - timeRemaining) / sessionDuration) * 100;
        progressBar.style.width = `${progress}%`;
    }

    function startSession() {
        if (isSessionActive) return;
        
        isSessionActive = true;
        binauralGenerator.start();
        
        sessionTimer = setInterval(() => {
            if (timeRemaining > 0) {
                timeRemaining--;
                updateTimerDisplay();
            } else {
                endSession();
            }
        }, 1000);
    }

    function endSession() {
        clearInterval(sessionTimer);
        isSessionActive = false;
        binauralGenerator.stop();
        timeRemaining = sessionDuration;
        updateTimerDisplay();
    }

    // Start session when music starts playing
    audioPlayer.addEventListener('play', startSession);
    audioPlayer.addEventListener('pause', endSession);
});
