import React from 'react';

interface PlaybackSliderProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const PlaybackSlider: React.FC<PlaybackSliderProps> = ({ currentTime, duration, onSeek }) => {
  return (
    <div className="w-full flex flex-col items-center">
      <input
        type="range"
        min={0}
        max={duration}
        step={0.01}
        value={currentTime}
        onChange={e => onSeek(Number(e.target.value))}
        className="w-full accent-piano-accent"
        aria-valuenow={currentTime}
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-label="Song position"
      />
      <div className="flex justify-between w-full text-[11px] text-gray-400 mt-0.5">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default PlaybackSlider; 