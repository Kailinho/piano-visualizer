import React, { useEffect, useRef } from 'react';
import { OpenSheetMusicDisplay as OSMD } from 'opensheetmusicdisplay';

interface SheetMusicDisplayProps {
  content: string;
  onReady?: () => void;
}

export const SheetMusicDisplay: React.FC<SheetMusicDisplayProps> = ({ content, onReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OSMD | null>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    const loadSheetMusic = async () => {
      try {
        if (!osmdRef.current) {
          osmdRef.current = new OSMD(containerRef.current, {
            autoResize: true,
            drawTitle: true,
            drawSubtitle: true,
            drawComposer: true,
            drawCredits: true,
          });
        }

        await osmdRef.current.load(content);
        osmdRef.current.render();
        onReady?.();
      } catch (error) {
        console.error('Error loading sheet music:', error);
      }
    };

    loadSheetMusic();

    return () => {
      osmdRef.current = null;
    };
  }, [content, onReady]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full overflow-auto bg-white"
    />
  );
};