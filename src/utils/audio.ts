import * as Tone from 'tone';

export class BinauralBeatGenerator {
  private leftOsc: Tone.Oscillator;
  private rightOsc: Tone.Oscillator;
  private gainNode: Tone.Gain;

  constructor() {
    this.leftOsc = new Tone.Oscillator().toDestination();
    this.rightOsc = new Tone.Oscillator().toDestination();
    this.gainNode = new Tone.Gain(0.5).toDestination();
    
    this.leftOsc.connect(this.gainNode);
    this.rightOsc.connect(this.gainNode);
  }

  setFrequency(baseFreq: number, beatFreq: number) {
    this.leftOsc.frequency.value = baseFreq;
    this.rightOsc.frequency.value = baseFreq + beatFreq;
  }

  setVolume(volume: number) {
    this.gainNode.gain.value = volume / 100;
  }

  start() {
    this.leftOsc.start();
    this.rightOsc.start();
  }

  stop() {
    this.leftOsc.stop();
    this.rightOsc.stop();
  }
}