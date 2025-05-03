import React from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';

// Utility constants and functions
const FIRST_MIDI = 21;
const LAST_MIDI = 108;
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function isBlackKey(note: number): boolean {
  const noteInOctave = note % 12;
  return [1, 3, 6, 8, 10].includes(noteInOctave);
}

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const note = noteNames[midi % 12];
  return `${note}${octave}`;
}

interface PianoVisualizerProps {
  width: number;
  height: number;
  activeNotes: number[]; // MIDI note numbers that are currently active
  highlightColor?: string;
}

const PianoVisualizer: React.FC<PianoVisualizerProps> = ({ width, height = 200, activeNotes, highlightColor = '#87CEEB' }) => {
  // 88-key piano: A0 (21) to C8 (108) inclusive
  const midiRange = Array.from({ length: LAST_MIDI - FIRST_MIDI + 1 }, (_, i) => i + FIRST_MIDI);
  const whiteNotes = midiRange.filter(n => !isBlackKey(n));
  const blackNotes = midiRange.filter(n => isBlackKey(n));
  const whiteKeyCount = whiteNotes.length;
  const whiteKeyWidth = width / whiteKeyCount;
  const blackKeyWidth = whiteKeyWidth * 0.6;
  const blackKeyHeight = height * 0.6;

  // Get the index of the white key for a given MIDI note in the range
  function getWhiteKeyIndex(note: number): number {
    return whiteNotes.indexOf(note);
  }

  // Get the x position for a given MIDI note
  function getKeyPosition(note: number): { x: number, isBlack: boolean } {
    const isBlack = isBlackKey(note);
    if (isBlack) {
      // Find the closest white key to the left in midiRange
      let leftWhite = note - 1;
      while (leftWhite >= FIRST_MIDI && isBlackKey(leftWhite)) {
        leftWhite--;
      }
      const prevWhiteIndex = getWhiteKeyIndex(leftWhite);
      // Place black key between the two white keys
      const x = prevWhiteIndex !== -1 ? (prevWhiteIndex + 1) * whiteKeyWidth - blackKeyWidth / 2 : 0;
      return { x, isBlack };
    } else {
      const idx = getWhiteKeyIndex(note);
      const x = idx * whiteKeyWidth;
      return { x, isBlack };
    }
  }

  return (
    <Stage width={width} height={height}>
      <Layer>
        {/* Background */}
        <Rect x={0} y={0} width={width} height={height} fill="#23243a" cornerRadius={18} shadowBlur={12} shadowColor="#23243a" />
        {/* White keys */}
        {whiteNotes.map((note, i) => (
          <React.Fragment key={`white-${note}`}>
            <Rect
              x={i * whiteKeyWidth}
              y={0}
              width={whiteKeyWidth}
              height={height}
              fill="white"
              stroke="#bbb"
              cornerRadius={6}
              className="piano-key-white"
            />
            {/* Add C labels on the key itself */}
            {(note % 12 === 0) && (
              <Text
                text={`C${Math.floor(note / 12) - 1}`}
                x={i * whiteKeyWidth}
                // Responsive y and font size for mobile
                y={height - (window.innerWidth < 640 ? 22 : 30)}
                width={whiteKeyWidth}
                align="center"
                fontSize={window.innerWidth < 640 ? 18 : 14}
                fill="#333"
                fontStyle="bold"
                listening={false}
              />
            )}
          </React.Fragment>
        ))}
        {/* Black keys */}
        {blackNotes.map((note) => {
          const { x } = getKeyPosition(note);
          return (
            <Rect
              key={`black-${note}`}
              x={x}
              y={0}
              width={blackKeyWidth}
              height={blackKeyHeight}
              fill="black"
              stroke="#23243a"
              cornerRadius={4}
              className="piano-key-black"
            />
          );
        })}
        {/* Active notes: white keys first */}
        {activeNotes.filter(n => n >= FIRST_MIDI && n <= LAST_MIDI).map((note) => {
          const isBlack = isBlackKey(note);
          const idx = isBlack ? blackNotes.indexOf(note) : whiteNotes.indexOf(note);
          if (idx === -1) return null;
          const x = isBlack
            ? (() => {
                // Black key position logic
                let leftWhite = note - 1;
                while (leftWhite >= FIRST_MIDI && isBlackKey(leftWhite)) leftWhite--;
                const prevWhiteIndex = whiteNotes.indexOf(leftWhite);
                return prevWhiteIndex !== -1 ? (prevWhiteIndex + 1) * whiteKeyWidth - blackKeyWidth / 2 : 0;
              })()
            : idx * whiteKeyWidth;
          return (
            <React.Fragment key={`active-${isBlack ? 'black' : 'white'}-${note}`}>
              <Rect
                x={x}
                y={0}
                width={isBlack ? blackKeyWidth : whiteKeyWidth}
                height={isBlack ? blackKeyHeight : height}
                fill={highlightColor}
                opacity={0.95}
                shadowBlur={16}
                shadowColor={highlightColor}
                cornerRadius={6}
              />
              <Text
                text={midiToNoteName(note)}
                x={x}
                y={isBlack ? blackKeyHeight / 2 - 12 : height / 2 - (window.innerWidth < 640 ? 18 : 12)}
                width={isBlack ? blackKeyWidth : whiteKeyWidth}
                align="center"
                fontSize={window.innerWidth < 640 ? 20 : 18}
                fontStyle="bold"
                fill={isBlack ? '#fff' : '#23243a'}
              />
            </React.Fragment>
          );
        })}
        {/* Active notes: black keys on top */}
        {activeNotes.filter(n => n >= FIRST_MIDI && n <= LAST_MIDI && isBlackKey(n)).map((note) => {
          const { x } = getKeyPosition(note);
          return (
            <Rect
              key={`active-black-${note}`}
              x={x - 2}
              y={-2}
              width={blackKeyWidth + 4}
              height={blackKeyHeight + 4}
              fill={highlightColor}
              opacity={0.95}
              shadowBlur={20}
              shadowColor={highlightColor}
              cornerRadius={6}
            />
          );
        })}
      </Layer>
    </Stage>
  );
};

export default PianoVisualizer; 