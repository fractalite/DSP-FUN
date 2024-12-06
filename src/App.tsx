import React, { useState, useEffect } from 'react';
import { VolumeControl } from './components/VolumeControl';
import { TrackSelector } from './components/TrackSelector';
import { FrequencyControl } from './components/FrequencyControl';
import { SessionTimer } from './components/SessionTimer';
import { BreathingGuide } from './components/BreathingGuide';
import { BinauralBeatGenerator } from './utils/audio';
import { FREQUENCY_RANGES } from './constants/frequencies';
import { VOLUME_PRESETS } from './constants/presets';
import type { Track, FrequencyRange, SessionSettings } from './types';

export default function App() {
  const [settings, setSettings] = useState<SessionSettings>({
    duration: 15,
    currentTrack: null,
    frequencyRange: FREQUENCY_RANGES[1], // Default to Theta
    volumes: VOLUME_PRESETS[0], // Default to Meditation preset
  });

  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [binauralGen] = useState(() => new BinauralBeatGenerator());

  useEffect(() => {
    let interval: number;
    
    if (isRunning) {
      interval = setInterval(() => {
        setCurrentTime((time) => {
          if (time >= settings.duration * 60) {
            setIsRunning(false);
            return 0;
          }
          return time + 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, settings.duration]);

  const handleStart = () => {
    if (!settings.currentTrack) return;
    setIsRunning(true);
    binauralGen.setFrequency(200, settings.frequencyRange.default);
    binauralGen.setVolume(settings.volumes.binaural);
    binauralGen.start();
  };

  const handleStop = () => {
    setIsRunning(false);
    setCurrentTime(0);
    binauralGen.stop();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Deep Meditation</h1>

        <div className="bg-gray-800 rounded-xl p-6 space-y-6">
          <TrackSelector
            currentTrack={settings.currentTrack}
            onTrackSelect={(track) =>
              setSettings((s) => ({ ...s, currentTrack: track }))
            }
          />

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Volume Levels</h2>
            <VolumeControl
              label="Music Volume"
              value={settings.volumes.music}
              onChange={(value) =>
                setSettings((s) => ({
                  ...s,
                  volumes: { ...s.volumes, music: value },
                }))
              }
            />
            <VolumeControl
              label="Binaural Beat Volume"
              value={settings.volumes.binaural}
              onChange={(value) => {
                setSettings((s) => ({
                  ...s,
                  volumes: { ...s.volumes, binaural: value },
                }));
                binauralGen.setVolume(value);
              }}
            />
            <VolumeControl
              label="Voice Volume"
              value={settings.volumes.voice}
              onChange={(value) =>
                setSettings((s) => ({
                  ...s,
                  volumes: { ...s.volumes, voice: value },
                }))
              }
            />
          </div>

          <FrequencyControl
            currentRange={settings.frequencyRange}
            frequency={settings.frequencyRange.default}
            onRangeChange={(range) =>
              setSettings((s) => ({ ...s, frequencyRange: range }))
            }
            onFrequencyChange={(freq) => {
              binauralGen.setFrequency(200, freq);
            }}
          />

          <SessionTimer
            duration={settings.duration}
            currentTime={currentTime}
            onDurationChange={(duration) =>
              setSettings((s) => ({ ...s, duration }))
            }
            isRunning={isRunning}
          />

          <BreathingGuide />

          <div className="flex justify-center">
            <button
              className={`px-8 py-3 rounded-lg font-semibold ${
                isRunning
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
              onClick={isRunning ? handleStop : handleStart}
              disabled={!settings.currentTrack}
            >
              {isRunning ? 'Stop Session' : 'Start Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}