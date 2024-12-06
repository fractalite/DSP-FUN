import React from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Volume2 } from 'lucide-react';

interface VolumeControlProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  value,
  onChange,
  label,
}) => {
  return (
    <div className="flex items-center space-x-4">
      <Volume2 className="w-5 h-5 text-gray-400" />
      <div className="flex-1">
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[value]}
          onValueChange={([newValue]) => onChange(newValue)}
          max={100}
          step={1}
        >
          <Slider.Track className="bg-gray-700 relative grow rounded-full h-1">
            <Slider.Range className="absolute bg-indigo-500 rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-4 h-4 bg-white rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label={label}
          />
        </Slider.Root>
      </div>
      <span className="text-sm text-gray-400 w-8">{value}%</span>
    </div>
  );
};