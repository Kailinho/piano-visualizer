import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  disabled?: boolean;
  fileName?: string;
  hideButtons?: boolean;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  onPlayPause,
  onReset,
  disabled = false,
  fileName,
  hideButtons = false,
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg shadow-md">
      {!hideButtons && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onPlayPause}
            disabled={disabled}
            className={`p-3 rounded-full transition-colors ${
              disabled
                ? 'bg-gray-200 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button
            onClick={onReset}
            disabled={disabled}
            className={`p-3 rounded-full transition-colors ${
              disabled
                ? 'bg-red-200 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            <RotateCcw size={24} />
          </button>
        </div>
      )}
    </div>
  );
};