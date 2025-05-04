import React, { useState, useCallback, useRef, useEffect } from 'react'
import FileUpload from './components/FileUpload'
import PianoVisualizer from './components/PianoVisualizer'
// import SheetMusicDisplay from './components/SheetMusicDisplay'
// import { processSheetMusic } from './services/api'
import { Midi } from '@tonejs/midi'
import * as Tone from 'tone'
import SpeedSlider from './components/SpeedSlider'
import FallingNotes from './components/FallingNotes'
import PlaybackSlider from './components/PlaybackSlider'
import { PlaybackControls } from './components/PlaybackControls'
import { Play, Pause, RotateCcw } from 'lucide-react'

// Responsive window size hook
function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    function handleResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return size;
}

function App() {
  // const [musicXML, setMusicXML] = useState<string>('')
  const [activeNotes, setActiveNotes] = useState<number[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [midiData, setMidiData] = useState<Midi | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const scheduledEventsRef = useRef<any[]>([])
  const samplerRef = useRef<Tone.Sampler | null>(null)
  const [speed, setSpeed] = useState(1.0)
  const [originalBpm, setOriginalBpm] = useState<number | null>(null)
  // Get current playback time from Tone.Transport
  const [currentTime, setCurrentTime] = useState(0)
  const speedRef = useRef(speed);
  useEffect(() => { speedRef.current = speed }, [speed]);

  // When a new MIDI file is loaded, store its BPM
  useEffect(() => {
    if (midiData) {
      // Get BPM from MIDI or default to 120
      const midiBpm = midiData.header.tempos?.[0]?.bpm || 120
      setOriginalBpm(midiBpm)
      Tone.Transport.bpm.value = midiBpm * speed
    }
  }, [midiData])

  // Update BPM whenever speed changes
  useEffect(() => {
    if (originalBpm) {
      Tone.Transport.bpm.value = originalBpm * speed
    }
  }, [speed, originalBpm])

  // Get current playback time from Tone.Transport
  useEffect(() => {
    let raf: number | null = null;
    function updateTime() {
      setCurrentTime(Tone.Transport.seconds)
      raf = requestAnimationFrame(updateTime)
    }
    if (isPlaying && midiData) {
      raf = requestAnimationFrame(updateTime)
    }
    return () => {
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [isPlaying, midiData])

  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const isMobile = windowWidth < 640;
  const isTabletLandscape = windowWidth >= 640 && windowWidth < 1024 && windowWidth > windowHeight;
  const showFloatingControls = (isMobile || isTabletLandscape) && Boolean(midiData);
  const isLandscape = windowWidth > windowHeight;
  const pianoWidth = Math.min(800, windowWidth - 32);
  // Ensure minimum height for keyboard so octave labels are visible (e.g., 60px on mobile/tablet, 120px on desktop)
  const pianoHeight = (isMobile || isTabletLandscape)
    ? Math.max(60, Math.min(80, windowHeight * 0.08))
    : Math.max(120, Math.min(200, windowHeight * 0.25));
  // Make the falling notes area fill all space between sliders and the keyboard
  const fallingNotesHeight = windowHeight - pianoHeight - 120; // 120px is an estimate for header/sliders, adjust as needed

  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true)
      setError(null)
      const arrayBuffer = await file.arrayBuffer()
      const midi = new Midi(arrayBuffer)
      setMidiData(midi)
      setFileName(file.name)
      setActiveNotes([])
      setIsPlaying(false)
      setIsPaused(false)
    } catch (err) {
      setError('Failed to process MIDI file. Please try again.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const scheduleAndStart = async () => {
    if (!midiData) return
    await Tone.start()
    if (!samplerRef.current) {
      samplerRef.current = new Tone.Sampler({
        urls: {
          A0: "A0.mp3",
          C1: "C1.mp3",
          "D#1": "Ds1.mp3",
          "F#1": "Fs1.mp3",
          A1: "A1.mp3",
          C2: "C2.mp3",
          "D#2": "Ds2.mp3",
          "F#2": "Fs2.mp3",
          A2: "A2.mp3",
          C3: "C3.mp3",
          "D#3": "Ds3.mp3",
          "F#3": "Fs3.mp3",
          A3: "A3.mp3",
          C4: "C4.mp3",
          "D#4": "Ds4.mp3",
          "F#4": "Fs4.mp3",
          A4: "A4.mp3",
          C5: "C5.mp3",
          "D#5": "Ds5.mp3",
          "F#5": "Fs5.mp3",
          A5: "A5.mp3",
          C6: "C6.mp3",
          "D#6": "Ds6.mp3",
          "F#6": "Fs6.mp3",
          A6: "A6.mp3",
          C7: "C7.mp3",
          "D#7": "Ds7.mp3",
          "F#7": "Fs7.mp3",
          A7: "A7.mp3",
          C8: "C8.mp3"
        },
        release: 1,
        baseUrl: "https://tonejs.github.io/audio/salamander/"
      }).toDestination();
      await Tone.loaded();
    }
    // Set BPM before starting, using latest speed
    if (originalBpm) {
      Tone.Transport.bpm.value = originalBpm * speedRef.current
    }
    const sampler = samplerRef.current
    Tone.Transport.cancel()
    setActiveNotes([])
    let allNotes: any[] = []
    midiData.tracks.forEach(track => {
      allNotes = allNotes.concat(track.notes)
    })
    allNotes.sort((a, b) => a.time - b.time)
    allNotes.forEach(note => {
      const onId = Tone.Transport.schedule((time) => {
        sampler.triggerAttack(Tone.Frequency(note.midi, 'midi').toNote(), time)
        setActiveNotes(prev => prev.includes(note.midi) ? prev : [...prev, note.midi])
      }, note.time)
      const offId = Tone.Transport.schedule((time) => {
        sampler.triggerRelease(Tone.Frequency(note.midi, 'midi').toNote(), time)
        setActiveNotes(prev => prev.filter(n => n !== note.midi))
      }, note.time + note.duration)
      scheduledEventsRef.current.push(onId, offId)
    })
    const endTime = allNotes.length > 0 ? allNotes[allNotes.length - 1].time + allNotes[allNotes.length - 1].duration : 0
    const stopId = Tone.Transport.schedule(() => {
      setActiveNotes([])
      Tone.Transport.stop()
      scheduledEventsRef.current.forEach(id => Tone.Transport.clear(id))
      scheduledEventsRef.current = []
      setIsPlaying(false)
      setIsPaused(false)
    }, endTime + 0.5)
    scheduledEventsRef.current.push(stopId)
    Tone.Transport.start()
    setIsPlaying(true)
    setIsPaused(false)
  }

  const handlePlayPause = useCallback(async () => {
    if (!midiData) return
    if (isPlaying && !isPaused) {
      Tone.Transport.pause()
      Tone.Transport.cancel() // Clear all scheduled events
      scheduledEventsRef.current.forEach(id => Tone.Transport.clear(id))
      scheduledEventsRef.current = []
      setIsPaused(true)
      setIsPlaying(false)
      // Release all currently active notes to avoid hanging sound
      if (samplerRef.current) {
        // Release all possible notes (MIDI 21-108) to ensure no lingering sound
        for (let midi = 21; midi <= 108; midi++) {
          samplerRef.current.triggerRelease(Tone.Frequency(midi, 'midi').toNote(), undefined)
        }
      }
      setActiveNotes([])
    } else if (isPaused) {
      await scheduleAndStart()
      setIsPaused(false)
      setIsPlaying(true)
    } else {
      await scheduleAndStart()
    }
  }, [midiData, isPlaying, isPaused, activeNotes])

  const handleRestart = useCallback(async () => {
    setSpeed(1.0); // Reset speed to 1.0 on restart (do this first)
    Tone.Transport.bpm.value = originalBpm || 120;
    Tone.Transport.stop();
    // Release all currently active notes to avoid hanging sound
    if (samplerRef.current) {
      activeNotes.forEach(midi => {
        samplerRef.current!.triggerRelease(Tone.Frequency(midi, 'midi').toNote(), undefined)
      });
    }
    setActiveNotes([]);
    setIsPlaying(false);
    setIsPaused(false);
    // Instead of starting playback, just reset the transport position to 0
    Tone.Transport.position = 0;
    setCurrentTime(0); // <-- Instantly reset slider to 0
    // Clear scheduled events
    Tone.Transport.cancel();
    scheduledEventsRef.current.forEach(id => Tone.Transport.clear(id));
    scheduledEventsRef.current = [];
    // Don't call scheduleAndStart, just reset state
  }, [midiData, activeNotes])

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-piano-bg to-blue-950 flex flex-col items-center overflow-x-hidden">
      <header className="flex flex-col items-center gap-2 mb-2 sm:mb-4 w-full">
        <span className="inline-block mb-1">
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="8" width="40" height="32" rx="8" fill="#22223b"/>
            <rect x="8" y="12" width="4" height="24" rx="2" fill="#f2e9e4"/>
            <rect x="16" y="12" width="4" height="24" rx="2" fill="#f2e9e4"/>
            <rect x="24" y="12" width="4" height="24" rx="2" fill="#f2e9e4"/>
            <rect x="32" y="12" width="4" height="24" rx="2" fill="#f2e9e4"/>
            <rect x="40" y="12" width="4" height="24" rx="2" fill="#f2e9e4"/>
          </svg>
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-piano-accent font-[Quicksand,system-ui,sans-serif] tracking-tight drop-shadow-lg text-center">
          Piano MIDI Visualizer
        </h1>
      </header>
      {/* Sliders above falling notes */}
      {midiData && (
        <div className="w-full flex flex-col sm:flex-row gap-2 sm:gap-6 items-center justify-center px-2 sm:px-8 mb-2">
          <div className="flex-1 w-full max-w-lg">
            <label className="text-xs text-gray-500 mb-1">Seek</label>
            <PlaybackSlider
              currentTime={currentTime}
              duration={midiData ? midiData.duration : 0}
              onSeek={time => {
                Tone.Transport.seconds = time;
                setCurrentTime(time);
              }}
            />
          </div>
          <div className="flex-1 w-full max-w-xs flex flex-col items-center justify-center">
            <SpeedSlider value={speed} onChange={setSpeed} min={0.5} max={2.0} step={0.01} labelPrefix="Speed:" />
          </div>
        </div>
      )}
      {/* Show falling notes area only if MIDI is loaded, otherwise show prompt */}
      {midiData ? (
        <section
          className="shadow-xl border border-blue-200 w-full relative mx-0"
          style={{
            maxWidth: '100vw',
            margin: 0,
            padding: 0,
            background: `radial-gradient(ellipse at center, rgba(35,36,58,0.98) 60%, rgba(30,30,47,1) 100%), linear-gradient(135deg, #23243a 0%, #1E1E2F 100%)`,
          }}
        >
          <div className="w-full flex justify-center mb-2 relative" style={{width: '100vw'}}>
            {/* Upload icon at top left */}
            <div className="absolute top-2 left-2 z-50">
              <FileUpload onFileUpload={handleFileUpload} isProcessing={isProcessing} />
            </div>
            {/* Playback controls at top right */}
            <div className="absolute top-2 right-2 z-50 flex gap-3">
              <button
                onClick={handlePlayPause}
                disabled={isProcessing || !midiData}
                className={`p-3 rounded-full transition-colors ${
                  isProcessing || !midiData
                    ? 'bg-gray-200 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
                title={isPlaying && !isPaused ? 'Pause' : 'Play'}
              >
                {isPlaying && !isPaused ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button
                onClick={handleRestart}
                disabled={isProcessing || !midiData}
                className={`p-3 rounded-full transition-colors ${
                  isProcessing || !midiData
                    ? 'bg-red-200 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
                title="Restart"
              >
                <RotateCcw size={24} />
              </button>
            </div>
            {/* Falling notes visualization */}
            <FallingNotes
              midiData={midiData}
              currentTime={currentTime}
              width={window.innerWidth}
              height={fallingNotesHeight}
              speed={speed}
            />
          </div>
          <div style={{ marginBottom: 0 }} />
        </section>
      ) : (
        <section className="w-full flex-1 flex items-center justify-center relative" style={{height: fallingNotesHeight, minHeight: 120}}>
          {/* Upload icon at top left */}
          <div className="absolute top-2 left-2 z-50">
            <FileUpload onFileUpload={handleFileUpload} isProcessing={isProcessing} />
          </div>
          <div className="w-full flex items-center justify-center">
            <span className="text-xl sm:text-2xl font-semibold text-piano-accent opacity-80 text-center select-none">
              Upload a MIDI File to Visualize
            </span>
          </div>
        </section>
      )}
      {/* Fixed full-width keyboard at the bottom */}
      <div
        className="fixed left-0 bottom-0 w-screen z-40 bg-transparent"
        style={{ pointerEvents: 'none' }}
      >
        <PianoVisualizer
          width={window.innerWidth}
          height={pianoHeight}
          activeNotes={activeNotes}
          highlightColor="#4F8EF7"
        />
      </div>
    </div>
  )
}

export default App
