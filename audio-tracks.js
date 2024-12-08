import { AudioOptimizer } from './js/utils/audioOptimizer.js';

class AudioTrackManager {
    constructor() {
        this.audioOptimizer = new AudioOptimizer();
        this.tracks = new Map();
        this.loadingTracks = new Set();
        this.preloadingTracks = new Set();
        this.masterGain = null;
        this.currentTrack = null;
        this.isFlowMode = false;
        this.playedTracks = new Set();
        
        // Initialize audio context after user interaction
        this.initPromise = this.initialize();
    }

    async initialize() {
        try {
            // Wait for AudioOptimizer to be ready
            await this.audioOptimizer.initialize();
            
            // Now we can safely use the audio context
            this.audioContext = this.audioOptimizer.audioContext;
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            
            console.debug('AudioTrackManager: Initialized successfully');
        } catch (error) {
            console.error('AudioTrackManager: Failed to initialize:', error);
            throw error;
        }
    }

    async loadTrack(url, trackId, showLoading = true) {
        // Ensure we're initialized
        await this.initPromise;
        
        if (this.tracks.has(trackId)) {
            return this.tracks.get(trackId);
        }

        try {
            if (showLoading) {
                this.setTrackLoadingState(trackId, true);
            }
            this.loadingTracks.add(trackId);

            // Load and optimize the audio file
            const optimizedBuffer = await this.audioOptimizer.loadAndOptimize(url);
            this.tracks.set(trackId, optimizedBuffer);
            
            return optimizedBuffer;
        } catch (error) {
            console.error(`Failed to load track ${trackId}:`, error);
            throw error;
        } finally {
            if (showLoading) {
                this.setTrackLoadingState(trackId, false);
            }
            this.loadingTracks.delete(trackId);
        }
    }

    setTrackLoadingState(trackId, isLoading) {
        const trackElement = document.querySelector(`[data-track-id="${trackId}"]`);
        if (trackElement) {
            if (isLoading) {
                trackElement.classList.add('track-loading');
            } else {
                trackElement.classList.remove('track-loading');
            }
        }
    }

    setTrackPreloadingState(trackId, isPreloading) {
        const trackElement = document.querySelector(`[data-track-id="${trackId}"]`);
        if (trackElement) {
            if (isPreloading) {
                trackElement.classList.add('track-preloading');
            } else {
                trackElement.classList.remove('track-preloading');
            }
        }
    }

    async preloadTrack(url, trackId) {
        if (this.tracks.has(trackId) || this.loadingTracks.has(trackId) || this.preloadingTracks.has(trackId)) {
            return;
        }

        try {
            this.preloadingTracks.add(trackId);
            this.setTrackPreloadingState(trackId, true);
            await this.loadTrack(url, trackId, false);
        } finally {
            this.preloadingTracks.delete(trackId);
            this.setTrackPreloadingState(trackId, false);
        }
    }

    getNextRandomTrack() {
        const availableTracks = Object.entries(window.audioTracks).filter(
            ([id]) => !this.playedTracks.has(id) && id !== this.currentTrack
        );

        if (availableTracks.length === 0) {
            // All tracks played, reset history
            this.playedTracks.clear();
            return Object.entries(window.audioTracks).find(([id]) => id !== this.currentTrack);
        }

        return availableTracks[Math.floor(Math.random() * availableTracks.length)];
    }

    preloadNextFlowTrack() {
        if (!this.isFlowMode) return;

        const [nextTrackId, nextTrack] = this.getNextRandomTrack() || [];
        if (nextTrackId && nextTrack) {
            // Use version A or B based on current preferences
            const trackUrl = nextTrack.versionA || nextTrack.versionB;
            this.preloadTrack(trackUrl, nextTrackId);
        }
    }

    async playTrack(trackId, options = {}) {
        const {
            loop = false,
            volume = 1,
            startTime = 0,
            endTime = null,
            flowMode = false
        } = options;

        if (this.currentTrack === trackId) return;

        if (!window.audioTracks[trackId]) {
            throw new Error(`Track ${trackId} not found`);
        }

        try {
            // Ensure we're initialized
            await this.initPromise;

            // Load the track if not already loaded
            if (!this.tracks.has(trackId)) {
                const trackUrl = window.audioTracks[trackId].versionA || window.audioTracks[trackId].versionB;
                await this.loadTrack(trackUrl, trackId);
            }

            const source = this.audioContext.createBufferSource();
            source.buffer = this.tracks.get(trackId);
            source.loop = loop;

            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = volume;

            source.connect(gainNode);
            gainNode.connect(this.masterGain);

            if (endTime) {
                source.start(0, startTime, endTime - startTime);
            } else {
                source.start(0, startTime);
            }

            this.currentTrack = trackId;
            this.isFlowMode = flowMode;
            this.playedTracks.add(trackId);

            // Preload next track if in flow mode
            if (flowMode) {
                this.preloadNextFlowTrack();
            }

            // Handle track end
            source.onended = () => {
                if (flowMode) {
                    const [nextTrackId] = this.getNextRandomTrack() || [];
                    if (nextTrackId) {
                        this.playTrack(nextTrackId, { flowMode: true, volume });
                    }
                }
            };

            return {
                source,
                gainNode
            };
        } catch (error) {
            console.error(`Failed to play track ${trackId}:`, error);
            throw error;
        }
    }

    setMasterVolume(value) {
        this.masterGain.gain.value = value;
    }

    stopTrack(trackId) {
        // Implementation remains the same
    }

    async exportTrack(trackId, filename) {
        // Implementation remains the same
    }
}

const audioTrackManager = new AudioTrackManager();

window.audioTracks = {
    'Dreams II': {
        name: 'Sacred Solfeggio Dreams II',
        versionA: 'audio/tracks/version-a/Sacred Solfeggio Dreams II-2.mp3',
        versionB: 'audio/tracks/version-b/Sacred Solfeggio Dreams II.mp3'
    },
    'Sacred Solfeggio': {
        name: 'Sacred Solfeggio Dreams',
        versionA: 'audio/tracks/version-a/Sacred Solfeggio Dreams-2.mp3',
        versionB: 'audio/tracks/version-b/Sacred Solfeggio Dreams.mp3'
    },
    'Angels Breath': {
        name: "Angel's Breath",
        versionA: 'audio/tracks/version-a/Angel\'s Breath-2.mp3',
        versionB: 'audio/tracks/version-b/Angel\'s Breath.mp3'
    },
    'Mother Earth': {
        name: "Mother Earth's Embrace",
        versionA: 'audio/tracks/version-a/Mother Earth\'s Embrace-2.mp3',
        versionB: 'audio/tracks/version-b/Mother Earth\'s Embrace.mp3'
    },
    'Sacred Temple': {
        name: 'Sacred Temple Gardens',
        versionA: 'audio/tracks/version-a/Sacred Temple Gardens-2.mp3',
        versionB: 'audio/tracks/version-b/Sacred Temple Gardens.mp3'
    },
    'Forest Night': {
        name: 'Forest Night',
        versionA: 'audio/tracks/version-a/Forest Night-2.mp3',
        versionB: 'audio/tracks/version-b/Forest Night.mp3'
    },
    'Deepest Surrender': {
        name: 'Deepest Surrender',
        versionA: 'audio/tracks/version-a/Deepest Surrender-2.mp3',
        versionB: 'audio/tracks/version-b/Deepest Surrender.mp3'
    },
    'Deepest Surrender II': {
        name: 'Deepest Surrender II',
        versionA: 'audio/tracks/version-b/Deepest Surrender II You-2.mp3',
        versionB: 'audio/tracks/version-a/Deepest Surrender II You.mp3'
    },
    'Deep Ocean': {
        name: 'Deep Ocean',
        versionA: 'audio/tracks/version-a/Deep Ocean-2.mp3',
        versionB: 'audio/tracks/version-b/Deep Ocean.mp3'
    },
    'Cosmic Flow': {
        name: 'Cosmic Flow',
        versionA: 'audio/tracks/version-a/Cosmic Flow-2.mp3',
        versionB: 'audio/tracks/version-b/Cosmic Flow.mp3'
    },
    'Coming Home': {
        name: 'Coming Home',
        versionA: 'audio/tracks/version-a/Coming Home-2.mp3',
        versionB: 'audio/tracks/version-b/Coming Home.mp3'
    }
};

export default audioTrackManager;
