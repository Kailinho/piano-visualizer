import React from 'react';

interface SpeedSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  labelPrefix?: string;
}

const SpeedSlider: React.FC<SpeedSliderProps> = ({
  value,
  min = 0.5,
  max = 2.0,
  step = 0.01,
  onChange,
  labelPrefix = 'Speed:',
}) => {
  // Handler for slider change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xs">
      <label htmlFor="speed-slider" className="mb-1 text-sm font-medium text-piano-accent">
        {labelPrefix} <span className="font-mono">{value.toFixed(2)}x</span>
      </label>
      <input
        id="speed-slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="w-full accent-piano-accent"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label="Playback speed"
      />
      <div className="flex justify-between w-full text-xs text-gray-400 mt-1">
        <span>{min}x</span>
        <span>{max}x</span>
      </div>

    </div>
  );
};

export default SpeedSlider; 