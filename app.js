document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    let audioPlayer = new Audio();
    let mediaRecorder = null;
    let audioChunks = [];
    let recordedAudio = null;
    let sessionTimer = null;
    let currentTrack = null;
    let currentVersion = 'A'; // Default to version A
    
    // Populate track selector
    const trackSelector = document.getElementById('track-selector');
    Object.entries(audioTracks).forEach(([key, track]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = track.name;
        trackSelector.appendChild(option);
    });

    // Version selection
    const versionA = document.getElementById('version-a');
    const versionB = document.getElementById('version-b');

    versionA.addEventListener('click', () => switchVersion('A'));
    versionB.addEventListener('click', () => switchVersion('B'));

    function switchVersion(version) {
        currentVersion = version;
        const wasPlaying = !audioPlayer.paused;
        const currentTime = audioPlayer.currentTime;
        
        // Update button states
        versionA.classList.toggle('active', version === 'A');
        versionB.classList.toggle('active', version === 'B');

        if (currentTrack) {
            // Load the new version while maintaining playback state
            audioPlayer.src = version === 'A' ? currentTrack.versionA : currentTrack.versionB;
            audioPlayer.load();
            audioPlayer.currentTime = currentTime;
            
            if (wasPlaying) {
                audioPlayer.play().catch(e => console.error('Playback failed:', e));
            }
        }
    }

    // Volume controls
    const musicVolume = document.getElementById('music-volume');
    const binauralVolume = document.getElementById('binaural-volume');
    const voiceVolume = document.getElementById('voice-volume');

    musicVolume.addEventListener('input', (e) => {
        audioPlayer.volume = e.target.value / 100;
        updateVolumeDisplay(e.target);
    });

    binauralVolume.addEventListener('input', (e) => {
        window.binauralGenerator.setVolume(e.target.value / 100);
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
            currentTrack = selectedTrack;
            const selectedVersion = currentVersion === 'A' ? selectedTrack.versionA : selectedTrack.versionB;
            
            audioPlayer.src = selectedVersion;
            audioPlayer.onerror = function() {
                console.error('Error loading audio file:', selectedVersion);
                alert('Audio file not found. Please ensure the audio files are in the correct location.');
            };
            audioPlayer.load();
        }
    });

    // Play/Pause control
    const playPauseBtn = document.getElementById('play-pause');
    playPauseBtn.addEventListener('click', () => {
        if (audioPlayer.paused) {
            audioPlayer.play().then(() => {
                playPauseBtn.textContent = 'Pause';
            }).catch(e => {
                console.error('Playback failed:', e);
                alert('Please select a track first');
            });
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

        return templates.map(template => template.replace('[goal]', intention));
    }

    // Volume Presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            applyVolumePreset(preset);
        });
    });

    function applyVolumePreset(preset) {
        const presets = {
            balanced: { music: 50, binaural: 5, voice: 50 },
            musicFocus: { music: 70, binaural: 5, voice: 30 },
            meditationFocus: { music: 30, binaural: 5, voice: 70 }
        };

        if (presets[preset]) {
            const settings = presets[preset];
            
            musicVolume.value = settings.music;
            binauralVolume.value = settings.binaural;
            voiceVolume.value = settings.voice;

            audioPlayer.volume = settings.music / 100;
            window.binauralGenerator.setVolume(settings.binaural / 100);
            if (recordedAudio) {
                recordedAudio.volume = settings.voice / 100;
            }

            // Update displays
            document.querySelectorAll('input[type="range"]').forEach(updateVolumeDisplay);
        }
    }

    // Session Timer
    const sessionTimerSlider = document.getElementById('session-timer');
    const timerDisplay = document.getElementById('timer-display');
    const progressBar = document.getElementById('progress-bar');

    let sessionStartTime = null;
    let sessionDuration = parseInt(sessionTimerSlider.value) * 60; // Convert to seconds

    sessionTimerSlider.addEventListener('input', () => {
        sessionDuration = parseInt(sessionTimerSlider.value) * 60;
        updateTimerDisplay();
    });

    function updateTimerDisplay() {
        const minutes = Math.floor(sessionDuration / 60);
        timerDisplay.textContent = `${minutes} minutes`;
    }

    function startSession() {
        if (!sessionStartTime) {
            sessionStartTime = Date.now();
            sessionTimer = setInterval(() => {
                const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
                const remaining = Math.max(0, sessionDuration - elapsed);
                const progress = (elapsed / sessionDuration) * 100;
                
                progressBar.style.width = `${progress}%`;
                
                if (remaining === 0) {
                    endSession();
                    audioPlayer.pause();
                }
            }, 1000);
        }
    }

    function endSession() {
        if (sessionTimer) {
            clearInterval(sessionTimer);
            sessionTimer = null;
            sessionStartTime = null;
            progressBar.style.width = '0%';
        }
    }

    // Start session when music starts playing
    audioPlayer.addEventListener('play', startSession);
    audioPlayer.addEventListener('pause', endSession);
});
