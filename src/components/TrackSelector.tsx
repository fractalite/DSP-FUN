import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Music, ChevronDown } from 'lucide-react';
import { Track } from '../types';
import { TRACKS } from '../constants/tracks';

interface TrackSelectorProps {
  currentTrack: Track | null;
  onTrackSelect: (track: Track) => void;
}

export const TrackSelector: React.FC<TrackSelectorProps> = ({
  currentTrack,
  onTrackSelect,
}) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex items-center px-4 py-2 bg-gray-800 rounded-lg text-gray-200 hover:bg-gray-700">
        <Music className="w-5 h-5 mr-2" />
        <span>{currentTrack?.title || 'Select Track'}</span>
        <ChevronDown className="w-4 h-4 ml-2" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Content className="bg-gray-800 rounded-lg p-2 w-64 shadow-xl">
        {TRACKS.map((track) => (
          <DropdownMenu.Item
            key={track.id}
            className="px-2 py-1 text-gray-200 hover:bg-gray-700 rounded cursor-pointer"
            onClick={() => onTrackSelect(track)}
          >
            {track.title}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};