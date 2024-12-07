importScripts('/js/libs/flac.js', '/js/libs/alac.js');

let encoder = null;

self.onmessage = async function(e) {
  if (e.data.command === 'encode') {
    try {
      const { audio } = e.data;
      const { channels, sampleRate, format } = audio;

      switch (format) {
        case 'flac':
          encoder = new FlacEncoder(sampleRate, channels.length);
          break;
        case 'alac':
          encoder = new AlacEncoder(sampleRate, channels.length);
          break;
        default:
          throw new Error('Unsupported format');
      }

      // Initialize encoder
      encoder.init();

      // Process audio data in chunks to avoid memory issues
      const CHUNK_SIZE = 4096;
      for (let i = 0; i < channels[0].length; i += CHUNK_SIZE) {
        const chunk = channels.map(channel => 
          channel.slice(i, Math.min(i + CHUNK_SIZE, channel.length))
        );
        encoder.encode(chunk);
      }

      // Finalize encoding
      const buffer = encoder.finish();

      // Send back the encoded audio
      self.postMessage({ buffer }, [buffer.buffer]);
    } catch (error) {
      self.postMessage({ error: error.message });
    } finally {
      if (encoder) {
        encoder.destroy();
        encoder = null;
      }
    }
  }
};
