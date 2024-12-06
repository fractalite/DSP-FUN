document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    let audioPlayer = new Audio();
    let currentTrack = null;
    let currentVersion = 'A'; // Default to version A
    
    // Populate track selector
    const trackSelector = document.getElementById('track-selector');
    if (trackSelector) {
        Object.entries(audioTracks).forEach(([key, track]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = track.name;
            trackSelector.appendChild(option);
        });
    }

    // Version selection
    const versionA = document.getElementById('version-a');
    const versionB = document.getElementById('version-b');

    if (versionA && versionB) {
        versionA.addEventListener('click', () => switchVersion('A'));
        versionB.addEventListener('click', () => switchVersion('B'));
    }

    function switchVersion(version) {
        currentVersion = version;
        const wasPlaying = !audioPlayer.paused;
        const currentTime = audioPlayer.currentTime;
        
        if (versionA && versionB) {
            versionA.classList.toggle('active', version === 'A');
            versionB.classList.toggle('active', version === 'B');
        }

        if (currentTrack) {
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

    if (musicVolume) {
        musicVolume.addEventListener('input', (e) => {
            audioPlayer.volume = e.target.value / 100;
            updateVolumeDisplay(e.target);
        });
    }

    if (binauralVolume) {
        binauralVolume.addEventListener('input', (e) => {
            if (window.binauralGenerator) {
                window.binauralGenerator.setVolume(e.target.value / 100);
            }
            updateVolumeDisplay(e.target);
        });
    }

    if (voiceVolume) {
        voiceVolume.addEventListener('input', (e) => {
            if (window.voiceRecorder) {
                window.voiceRecorder.setVolume(e.target.value / 100);
            }
            updateVolumeDisplay(e.target);
        });
    }

    function updateVolumeDisplay(slider) {
        const display = slider.nextElementSibling;
        if (display) {
            display.textContent = `${slider.value}%`;
        }
    }

    // Track selection and playback
    if (trackSelector) {
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
    }

    // Play/Pause control for music
    const playPauseBtn = document.getElementById('play-pause');
    if (playPauseBtn) {
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
    }

    // Loop control for music
    const loopBtn = document.getElementById('loop');
    if (loopBtn) {
        loopBtn.addEventListener('click', () => {
            audioPlayer.loop = !audioPlayer.loop;
            loopBtn.style.backgroundColor = audioPlayer.loop ? 'var(--hover-color)' : 'var(--accent-color)';
        });
    }

    // Help modal
    const helpIcon = document.getElementById('help-icon');
    const helpModal = document.getElementById('help-modal');
    const closeModal = document.querySelector('.close');

    if (helpIcon && helpModal && closeModal) {
        helpIcon.addEventListener('click', () => {
            helpModal.style.display = 'block';
        });

        closeModal.addEventListener('click', () => {
            helpModal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === helpModal) {
                helpModal.style.display = 'none';
            }
        });
    }

    // Volume Presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            if (preset) {
                applyVolumePreset(preset);
            }
        });
    });

    function applyVolumePreset(preset) {
        const presets = {
            meditation: { music: 30, binaural: 5, voice: 70 },
            sleep: { music: 20, binaural: 3, voice: 50 },
            affirmation: { music: 40, binaural: 5, voice: 100 }
        };

        const settings = presets[preset];
        if (settings) {
            if (musicVolume) {
                musicVolume.value = settings.music;
                audioPlayer.volume = settings.music / 100;
            }
            if (binauralVolume && window.binauralGenerator) {
                binauralVolume.value = settings.binaural;
                window.binauralGenerator.setVolume(settings.binaural / 100);
            }
            if (voiceVolume && window.voiceRecorder) {
                voiceVolume.value = settings.voice;
                window.voiceRecorder.setVolume(settings.voice / 100);
            }

            // Update all volume displays
            document.querySelectorAll('input[type="range"]').forEach(updateVolumeDisplay);
        }
    }
});
