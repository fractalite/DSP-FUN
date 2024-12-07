// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    let audioPlayer = new Audio();
    let currentTrack = null;
    let currentVersion = 'A'; // Default to version A
    let isPlaybackRequested = false;
    let isFlowActive = false;
    let trackList = [];
    let currentTrackIndex = -1;

    // Helper function to get random track and version
    function getRandomTrack() {
        const randomIndex = Math.floor(Math.random() * trackList.length);
        const randomVersion = Math.random() < 0.5 ? 'A' : 'B';
        return { track: trackList[randomIndex], version: randomVersion };
    }

    // Function to play a specific track and version
    function playTrackAndVersion(track, version) {
        trackSelector.value = track.key;
        currentTrack = audioTracks[track.key];
        currentVersion = version;
        
        // Update version buttons
        if (versionA && versionB) {
            versionA.classList.toggle('active', version === 'A');
            versionB.classList.toggle('active', version === 'B');
        }

        audioPlayer.src = version === 'A' ? currentTrack.versionA : currentTrack.versionB;
        audioPlayer.load();
        audioPlayer.play().then(() => {
            if (playPauseBtn) playPauseBtn.textContent = 'Pause';
        }).catch(error => console.warn('Playback failed:', error));
    }

    // Initialize audio player settings
    audioPlayer.loop = false;

    // Populate track selector and track list
    const trackSelector = document.getElementById('track-selector');
    if (trackSelector) {
        Object.entries(audioTracks).forEach(([key, track]) => {
            trackList.push({ key, ...track });
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
            isPlaybackRequested = wasPlaying;
            audioPlayer.src = version === 'A' ? currentTrack.versionA : currentTrack.versionB;
            audioPlayer.load();
            audioPlayer.currentTime = currentTime;
            
            if (wasPlaying) {
                const playPromise = audioPlayer.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        if (error.name === 'AbortError' && isPlaybackRequested) {
                            // Retry playback once if it was aborted but still requested
                            setTimeout(() => {
                                audioPlayer.play().catch(e => console.warn('Retry playback failed:', e));
                            }, 100);
                        }
                    });
                }
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
                currentTrackIndex = trackList.findIndex(track => track.key === trackSelector.value);
                const audioPath = currentVersion === 'A' ? selectedTrack.versionA : selectedTrack.versionB;
                console.log('Loading audio track:', audioPath); // Debug log
                audioPlayer.src = audioPath;
                audioPlayer.load();
                
                // Add error event listener
                audioPlayer.onerror = (e) => {
                    console.error('Audio loading error:', audioPlayer.error);
                };
            }
        });
    }

    // Play/Pause button
    const playPauseBtn = document.getElementById('play-pause');
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            if (audioPlayer.paused) {
                isPlaybackRequested = true;
                const playPromise = audioPlayer.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            playPauseBtn.textContent = 'Pause';
                        })
                        .catch(error => {
                            if (error.name === 'AbortError' && isPlaybackRequested) {
                                // Retry playback once if it was aborted but still requested
                                setTimeout(() => {
                                    audioPlayer.play()
                                        .then(() => {
                                            playPauseBtn.textContent = 'Pause';
                                        })
                                        .catch(e => console.warn('Retry playback failed:', e));
                                }, 100);
                            }
                        });
                }
            } else {
                isPlaybackRequested = false;
                audioPlayer.pause();
                playPauseBtn.textContent = 'Play';
            }
        });
    }

    // Loop button
    const loopBtn = document.getElementById('loop');
    if (loopBtn) {
        loopBtn.addEventListener('click', () => {
            audioPlayer.loop = !audioPlayer.loop;
            loopBtn.classList.toggle('active');
            
            // If enabling loop, disable flow
            if (audioPlayer.loop && isFlowActive) {
                isFlowActive = false;
                if (flowBtn) flowBtn.classList.remove('active');
            }
        });
    }

    // Flow button
    const flowBtn = document.getElementById('flow');
    if (flowBtn) {
        flowBtn.addEventListener('click', () => {
            isFlowActive = !isFlowActive;
            flowBtn.classList.toggle('active');
            
            // If enabling flow, disable loop
            if (isFlowActive && audioPlayer.loop) {
                audioPlayer.loop = false;
                if (loopBtn) loopBtn.classList.remove('active');
            }
            
            // If activating flow and nothing is currently playing, start with random track
            if (isFlowActive && audioPlayer.paused && trackList.length > 0) {
                const { track, version } = getRandomTrack();
                playTrackAndVersion(track, version);
            }
        });
    }

    // Handle track ending
    audioPlayer.addEventListener('ended', () => {
        if (isFlowActive && trackList.length > 0) {
            const { track, version } = getRandomTrack();
            playTrackAndVersion(track, version);
        } else if (!audioPlayer.loop) {
            if (playPauseBtn) playPauseBtn.textContent = 'Play';
        }
    });

    // Stop All button
    const stopAllBtn = document.getElementById('stop-all');
    if (stopAllBtn) {
        const originalClickHandler = stopAllBtn.onclick;
        stopAllBtn.addEventListener('click', () => {
            // Stop music
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            if (playPauseBtn) playPauseBtn.textContent = 'Play';

            // Stop binaural beats
            if (window.binauralGenerator) {
                window.binauralGenerator.stop();
                // Reset all binaural buttons
                document.querySelectorAll('.freq-btn, .journey-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
            }

            // Stop voice recording playback
            if (window.voiceRecorder) {
                window.voiceRecorder.stopPlayback();
            }

            // Reset loop button
            const loopBtn = document.getElementById('loop');
            if (loopBtn) {
                audioPlayer.loop = false;
                loopBtn.classList.remove('active');
            }

            // Stop flow
            isFlowActive = false;
            if (flowBtn) flowBtn.classList.remove('active');
        });
    }
});
