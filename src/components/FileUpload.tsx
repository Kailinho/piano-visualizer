import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

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
      className={`
        border-2 border-dashed rounded-lg p-4 sm:p-3 text-center cursor-pointer
        transition-all duration-200 text-base
        ${isDragActive ? 'border-piano-accent bg-piano-accent/10' : 'border-gray-600'}
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:border-piano-accent hover:bg-piano-accent/5'}
        w-full max-w-xs sm:max-w-xs mx-auto
      `}
    >
      <input {...getInputProps()} />
      {isProcessing ? (
        <span className="text-gray-400">Processing...</span>
      ) : isDragActive ? (
        <span className="text-piano-accent">Drop MIDI file...</span>
      ) : (
        <span className="text-piano-accent">Upload MIDI (.mid) file</span>
      )}
    </div>
  );
};

export default FileUpload; 