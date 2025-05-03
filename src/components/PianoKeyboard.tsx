import React from 'react';

interface PianoKeyProps {
  note: string;
  isBlack: boolean;
  isActive?: boolean;
}

const PianoKey: React.FC<PianoKeyProps> = ({ note, isBlack, isActive }) => {
  const baseWhiteKeyClass = "h-40 w-10 border border-gray-300 rounded-b-md";
  const baseBlackKeyClass = "h-24 w-6 absolute -ml-3 z-10 rounded-b-md";
  
  return (
    <div
      className={`
        ${isBlack ? baseBlackKeyClass : baseWhiteKeyClass}
        ${isBlack ? 'bg-gray-800' : 'bg-white'}
        ${isActive ? 'bg-blue-500' : ''}
        transition-colors duration-100
      `}
      data-note={note}
    />
  );
};

export const PianoKeyboard: React.FC<{ activeNotes?: string[] }> = ({ activeNotes = [] }) => {
  const keys = [
    { note: 'C', isBlack: false },
    { note: 'C#', isBlack: true },
    { note: 'D', isBlack: false },
    { note: 'D#', isBlack: true },
    { note: 'E', isBlack: false },
    { note: 'F', isBlack: false },
    { note: 'F#', isBlack: true },
    { note: 'G', isBlack: false },
    { note: 'G#', isBlack: true },
    { note: 'A', isBlack: false },
    { note: 'A#', isBlack: true },
    { note: 'B', isBlack: false },
  ];

  const octaves = [4, 5, 6]; // 3 octaves

  return (
    <div className="flex justify-center items-end p-4 bg-gray-100 rounded-lg shadow-inner">
      <div className="relative flex">
        {octaves.map((octave) =>
          keys.map(({ note, isBlack }) => (
            <PianoKey
              key={`${note}${octave}`}
              note={`${note}${octave}`}
              isBlack={isBlack}
              isActive={activeNotes.includes(`${note}${octave}`)}
            />
          ))
        )}
      </div>
    </div>
  );
};