import React, { useMemo } from 'react';
import { Stage, Layer, Rect, Text, Line } from 'react-konva';
import { Midi } from '@tonejs/midi';

// Utility constants and functions
const DEFAULT_HEIGHT = 300;
const FIRST_MIDI = 21;
const LAST_MIDI = 108;
const midiRange = Array.from({ length: LAST_MIDI - FIRST_MIDI + 1 }, (_, i) => i + FIRST_MIDI);
const whiteNotes = midiRange.filter(n => !isBlackKey(n));
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function isBlackKey(note: number): boolean {
  const noteInOctave = note % 12;
  return [1, 3, 6, 8, 10].includes(noteInOctave);
}

function getWhiteKeyIndex(note: number): number {
  return whiteNotes.indexOf(note);
}

function getKeyPosition(note: number, width: number): { x: number, isBlack: boolean, whiteKeyWidth: number, blackKeyWidth: number } {
  const whiteKeyCount = whiteNotes.length;
  const whiteKeyWidth = width / whiteKeyCount;
  const blackKeyWidth = whiteKeyWidth * 0.6;
  const isBlack = isBlackKey(note);
  if (isBlack) {
    let leftWhite = note - 1;
    while (leftWhite >= FIRST_MIDI && isBlackKey(leftWhite)) {
      leftWhite--;
    }
    const prevWhiteIndex = getWhiteKeyIndex(leftWhite);
    const x = prevWhiteIndex !== -1 ? (prevWhiteIndex + 1) * whiteKeyWidth - blackKeyWidth / 2 : 0;
    return { x, isBlack, whiteKeyWidth, blackKeyWidth };
  } else {
    const idx = getWhiteKeyIndex(note);
    const x = idx * whiteKeyWidth;
    return { x, isBlack, whiteKeyWidth, blackKeyWidth };
  }
}

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const note = noteNames[midi % 12];
  return `${note}${octave}`;
}

const WINDOW_SECONDS = 4;
const NOTE_COLOR = '#4F8EF7';
const NOTE_BORDER = '#23243a';
const MIN_NOTE_HEIGHT = 24;
const NOTE_GAP = 2;

interface FallingNotesProps {
  midiData: Midi;
  currentTime: number; // in seconds
  width: number;
  height?: number; // Optional, default to 300
  speed: number; // Playback speed
}

const FallingNotes: React.FC<FallingNotesProps> = ({
  midiData,
  currentTime,
  width,
  height = DEFAULT_HEIGHT,
  speed,
}) => {
  // Flatten all notes from all tracks
  const allNotes = useMemo(() => {
    const notes: typeof midiData.tracks[0]["notes"] = [];
    midiData.tracks.forEach(track => {
      notes.push(...track.notes);
    });
    return notes;
  }, [midiData]);

  // The falling window always represents a fixed real-time window
  // On small screens, halve the window to reduce cramping
  const isMobile = width < 600;
  const effectiveWindow = (isMobile ? WINDOW_SECONDS / 2 : WINDOW_SECONDS) / speed;

  // Filter notes that are visible in the falling window
  const fallingNotes = allNotes.filter(note => (
    note.time + note.duration > currentTime &&
    note.time < currentTime + effectiveWindow
  ));

  // Group notes by pitch for gap logic
  const notesByPitch: { [midi: number]: typeof allNotes } = {};
  fallingNotes.forEach(note => {
    if (!notesByPitch[note.midi]) notesByPitch[note.midi] = [];
    notesByPitch[note.midi].push(note);
  });

  // Y position for the landing line (bottom of falling notes area)
  const landingLineY = height - 2;

  // Render notes for each pitch
  const renderedNotes: React.ReactNode[] = [];
  Object.entries(notesByPitch).forEach(([midi, notes]) => {
    // Sort notes by start time (descending)
    notes.sort((a, b) => b.time - a.time);
    let lastEndY: number | null = null;
    notes.forEach((note, i) => {
      const { x, isBlack, whiteKeyWidth, blackKeyWidth } = getKeyPosition(note.midi, width);
      const endY = height - ((note.time - currentTime) / effectiveWindow) * height;
      const startY = height - ((note.time + note.duration - currentTime) / effectiveWindow) * height;
      const noteWidth = isBlack ? blackKeyWidth : whiteKeyWidth;
      let yTop = Math.min(startY, endY);
      let yBottom = Math.max(startY, endY);
      // Only render if any part of the note is visible
      if (yBottom > 0 && yTop < height) {
        // Clamp to visible area
        let rectY = Math.max(yTop, 0);
        let noteHeight = Math.max(Math.min(yBottom, height) - rectY, MIN_NOTE_HEIGHT);
        // If this note would overlap the previous note of the same pitch, add a gap
        if (lastEndY !== null && rectY < lastEndY + NOTE_GAP) {
          rectY = lastEndY + NOTE_GAP;
        }
        lastEndY = rectY + noteHeight;
        // Show only the letter (no #, no octave) for all notes
        const noteName = noteNames[note.midi % 12];
        const label = noteName.replace('#', '');
        // Font size logic
        const fontSize = width < 500 ? 11 : 15;
        const minLabelHeight = fontSize + 2;
        let labelY;
        let labelFontSize = fontSize;
        let labelX = x;
        let labelWidth = noteWidth;
        // Always center label within the rectangle, even for thin notes
        if (noteWidth < 18) {
          labelFontSize = 9;
          labelWidth = 18;
          labelX = x - (18 - noteWidth) / 2;
          labelY = rectY + noteHeight / 2 - labelFontSize / 2;
        } else if (noteHeight < minLabelHeight) {
          labelFontSize = Math.max(9, fontSize - 3);
          labelY = rectY + noteHeight / 2 - labelFontSize / 2;
        } else {
          labelY = rectY + 2;
        }
        // Clamp labelY to canvas
        labelY = Math.max(0, Math.min(labelY, height - labelFontSize));
        renderedNotes.push(
          <React.Fragment key={note.time + '-' + note.midi + '-' + i}>
            <Rect
              x={x}
              y={rectY}
              width={noteWidth}
              height={noteHeight}
              fill={NOTE_COLOR}
              opacity={0.85}
              cornerRadius={isBlack ? 4 : 6}
              shadowBlur={isBlack ? 8 : 0}
              shadowColor={NOTE_COLOR}
              stroke={NOTE_BORDER}
              strokeWidth={1}
            />
            {/* Show label for all notes, white or black */}
            <Text
              text={label}
              x={labelX}
              y={labelY}
              width={labelWidth}
              align="center"
              fontSize={labelFontSize}
              fontStyle="bold"
              fill={isBlack ? '#fff' : '#23243a'}
              listening={false}
            />
          </React.Fragment>
        );
      }
    });
  });

  return (
    <Stage width={width} height={height}>
      <Layer>
        {/* Fade-out gradient at the top */}
        <Rect
          x={0}
          y={0}
          width={width}
          height={40}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 0, y: 40 }}
          fillLinearGradientColorStops={[0, '#e3e8f0', 1, 'rgba(227,232,240,0)']}
          listening={false}
        />
        {/* Render falling notes */}
        {renderedNotes}
        {/* Landing line at the bottom */}
        <Line
          points={[0, landingLineY, width, landingLineY]}
          stroke="#6A5ACD"
          strokeWidth={3}
          opacity={0.7}
          listening={false}
        />
      </Layer>
    </Stage>
  );
};

export default FallingNotes; 