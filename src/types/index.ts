export interface Track {
  id: string;
  title: string;
  urlA: string;
  urlB: string;
}

export interface FrequencyRange {
  name: string;
  min: number;
  max: number;
  default: number;
  description: string;
}

export interface VolumePreset {
  name: string;
  music: number;
  binaural: number;
  voice: number;
}

export interface SessionSettings {
  duration: number;
  currentTrack: Track | null;
  frequencyRange: FrequencyRange;
  volumes: {
    music: number;
    binaural: number;
    voice: number;
  };
}