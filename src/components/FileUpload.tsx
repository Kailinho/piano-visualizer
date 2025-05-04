import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isProcessing?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isProcessing = false }) => {
  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/midi': ['.mid']
    },
    multiple: false,
    disabled: isProcessing
  });

  return (
    <div
      {...getRootProps()}
      className={`group relative flex items-center justify-center`}
      style={{ pointerEvents: isProcessing ? 'none' : undefined }}
    >
      <input {...getInputProps()} />
      <button
        type="button"
        className={`p-3 rounded-full bg-white/90 shadow-lg border border-blue-200 hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        tabIndex={-1}
        aria-label="Upload MIDI file"
        disabled={isProcessing}
        style={{ fontSize: 0 }}
      >
        <Upload size={28} className="text-piano-accent" />
      </button>
      {/* Tooltip: show to the right of the button for visibility */}
      <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {isProcessing ? 'Processing...' : 'Upload MIDI file'}
      </span>
    </div>
  );
};

export default FileUpload; 