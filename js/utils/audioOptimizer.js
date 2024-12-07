/**
 * AudioOptimizer class for handling lossless audio optimization
 */
export class AudioOptimizer {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.flacSupported = this.checkFlacSupport();
    this.alacSupported = this.checkAlacSupport();
  }

  /**
   * Check FLAC support
   */
  checkFlacSupport() {
    const audio = document.createElement('audio');
    return audio.canPlayType('audio/flac') !== '';
  }

  /**
   * Check ALAC support
   */
  checkAlacSupport() {
    const audio = document.createElement('audio');
    return audio.canPlayType('audio/mp4; codecs="alac"') !== '';
  }

  /**
   * Get optimal format based on browser support
   */
  getOptimalFormat() {
    if (this.flacSupported) return 'flac';
    if (this.alacSupported) return 'alac';
    return 'wav'; // Fallback to uncompressed
  }

  /**
   * Convert AudioBuffer to optimal lossless format
   * @param {AudioBuffer} audioBuffer - The audio buffer to convert
   * @returns {Promise<Blob>} - The converted audio blob
   */
  async convertToOptimalFormat(audioBuffer) {
    const format = this.getOptimalFormat();
    const worker = new Worker('/js/workers/audioEncoderWorker.js');

    return new Promise((resolve, reject) => {
      worker.onmessage = (e) => {
        if (e.data.error) {
          reject(new Error(e.data.error));
        } else {
          resolve(new Blob([e.data.buffer], { type: `audio/${format}` }));
        }
        worker.terminate();
      };

      // Convert AudioBuffer to Float32Array
      const audioData = {
        channels: [],
        sampleRate: audioBuffer.sampleRate,
        format
      };

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        audioData.channels.push(audioBuffer.getChannelData(channel));
      }

      worker.postMessage({ command: 'encode', audio: audioData });
    });
  }

  /**
   * Load and optimize audio file
   * @param {string} url - URL of the audio file
   * @returns {Promise<AudioBuffer>} - Optimized audio buffer
   */
  async loadAndOptimize(url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Store original sample rate for quality comparison
      const originalSampleRate = audioBuffer.sampleRate;
      
      // Only optimize if not already in optimal format
      const fileExtension = url.split('.').pop().toLowerCase();
      if (fileExtension === this.getOptimalFormat()) {
        console.log('Audio already in optimal format');
        return audioBuffer;
      }

      const optimizedBlob = await this.convertToOptimalFormat(audioBuffer);
      const optimizedArrayBuffer = await optimizedBlob.arrayBuffer();
      const optimizedAudioBuffer = await this.audioContext.decodeAudioData(optimizedArrayBuffer);

      // Verify quality maintained
      if (optimizedAudioBuffer.sampleRate < originalSampleRate) {
        console.warn('Quality loss detected, using original audio');
        return audioBuffer;
      }

      return optimizedAudioBuffer;
    } catch (error) {
      console.error('Audio optimization failed:', error);
      throw error;
    }
  }

  /**
   * Create optimal audio buffer for binaural beats
   * @param {number} frequency - Base frequency
   * @param {number} beatFrequency - Beat frequency
   * @returns {AudioBuffer} - Optimized audio buffer
   */
  createOptimalBinauralBuffer(frequency, beatFrequency) {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 2; // 2 seconds of audio
    const frameCount = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, frameCount, sampleRate);

    // Generate high-quality binaural beat
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      const channelFreq = channel === 0 ? frequency : frequency + beatFrequency;

      for (let i = 0; i < frameCount; i++) {
        // Use precise phase calculation
        const t = i / sampleRate;
        channelData[i] = Math.sin(2 * Math.PI * channelFreq * t);
      }
    }

    return buffer;
  }

  /**
   * Export audio buffer to file
   * @param {AudioBuffer} buffer - Audio buffer to export
   * @param {string} filename - Output filename
   * @returns {Promise<Blob>} - Audio file blob
   */
  async exportToFile(buffer, filename) {
    const format = this.getOptimalFormat();
    const blob = await this.convertToOptimalFormat(buffer);
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${format}`;
    
    // Cleanup
    link.click();
    URL.revokeObjectURL(url);
    
    return blob;
  }
}
