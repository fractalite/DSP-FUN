import React from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Waveform } from 'lucide-react';
import { FrequencyRange } from '../types';
import { FREQUENCY_RANGES } from '../constants/frequencies';

interface FrequencyControlProps {
  currentRange: FrequencyRange;
  frequency: number;
  onRangeChange: (range: FrequencyRange) => void;
  onFrequencyChange: (freq: number) => void;
}

export const FrequencyControl: React.FC<FrequencyControlProps> = ({
  currentRange,
  frequency,
  onRangeChange,
  onFrequencyChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        {FREQUENCY_RANGES.map((range) => (
          <button
            key={range.name}
            className={`px-4 py-2 rounded-lg ${
              currentRange.name === range.name
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => onRangeChange(range)}
          >
            {range.name}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-4">
        <Waveform className="w-5 h-5 text-gray-400" />
        <div className="flex-1">
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[frequency]}
            onValueChange={([newValue]) => onFrequencyChange(newValue)}
            min={currentRange.min}
            max={currentRange.max}
            step={0.1}
          >
            <Slider.Track className="bg-gray-700 relative grow rounded-full h-1">
              <Slider.Range className="absolute bg-indigo-500 rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-4 h-4 bg-white rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Frequency"
            />
          </Slider.Root>
        </div>
        <span className="text-sm text-gray-400 w-16">{frequency.toFixed(1)} Hz</span>
      </div>
      
      <p className="text-sm text-gray-400">{currentRange.description}</p>
    </div>
  );
};