import React from 'react';
import * as Progress from '@radix-ui/react-progress';
import { Timer } from 'lucide-react';

interface SessionTimerProps {
  duration: number;
  currentTime: number;
  onDurationChange: (minutes: number) => void;
  isRunning: boolean;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({
  duration,
  currentTime,
  onDurationChange,
  isRunning,
}) => {
  const progress = (currentTime / (duration * 60)) * 100;
  const timeLeft = Math.max(0, duration * 60 - currentTime);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = Math.floor(timeLeft % 60);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Timer className="w-5 h-5 text-gray-400" />
          <select
            className="bg-gray-800 text-gray-200 rounded-lg px-2 py-1"
            value={duration}
            onChange={(e) => onDurationChange(Number(e.target.value))}
            disabled={isRunning}
          >
            {[5, 10, 15, 20, 30, 45, 60].map((mins) => (
              <option key={mins} value={mins}>
                {mins} minutes
              </option>
            ))}
          </select>
        </div>
        <div className="text-gray-200">
          {minutes.toString().padStart(2, '0')}:
          {seconds.toString().padStart(2, '0')}
        </div>
      </div>

      <Progress.Root
        className="relative overflow-hidden bg-gray-700 rounded-full w-full h-2"
        value={progress}
      >
        <Progress.Indicator
          className="bg-indigo-500 w-full h-full transition-transform duration-[660ms] ease-[cubic-bezier(0.65, 0, 0.35, 1)]"
          style={{ transform: `translateX(-${100 - progress}%)` }}
        />
      </Progress.Root>
    </div>
  );
};