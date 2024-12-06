import { FrequencyRange } from '../types';

export const FREQUENCY_RANGES: FrequencyRange[] = [
  {
    name: 'Delta',
    min: 0.5,
    max: 4.0,
    default: 2.5,
    description: 'Deep subconscious/sleep',
  },
  {
    name: 'Theta',
    min: 4.5,
    max: 7.5,
    default: 6.0,
    description: 'Deep meditation/reprogramming',
  },
  {
    name: 'Alpha',
    min: 8.4,
    max: 12.0,
    default: 10.0,
    description: 'Light relaxation/conscious awareness',
  },
];