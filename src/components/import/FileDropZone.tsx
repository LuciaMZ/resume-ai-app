'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';

// =============================================================================
// FileDropZone
// =============================================================================

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function FileDropZone({ onFileSelect, disabled = false }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setError(null);

      if (file.type !== 'application/pdf') {
        setError('Only PDF files are supported.');
        return;
      }

      // 10 MB limit
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be under 10 MB.');
        return;
      }

      setSelectedFile(file);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) validateAndSelect(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  function handleClearFile(e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
  }

  function handleClick() {
    if (!disabled) inputRef.current?.click();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-all duration-200 ${
          disabled
            ? 'cursor-not-allowed border-surface-200 bg-surface-50 opacity-60'
            : isDragOver
              ? 'border-primary-400 bg-primary-50 shadow-sm'
              : selectedFile
                ? 'cursor-pointer border-primary-300 bg-primary-50/50'
                : 'cursor-pointer border-surface-300 bg-surface-50 hover:border-primary-300 hover:bg-primary-50/30'
        }`}
        aria-label="Drop a PDF file here or click to browse"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleInputChange}
          className="hidden"
          aria-hidden="true"
          disabled={disabled}
        />

        {selectedFile ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
              <FileText className="h-5 w-5 text-primary-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-surface-900">
                {selectedFile.name}
              </p>
              <p className="text-xs text-surface-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearFile}
              className="ml-2 rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-200 hover:text-surface-600"
              aria-label="Remove selected file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div
              className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                isDragOver ? 'bg-primary-200' : 'bg-surface-200'
              }`}
            >
              <Upload
                className={`h-6 w-6 transition-colors ${
                  isDragOver ? 'text-primary-600' : 'text-surface-500'
                }`}
              />
            </div>
            <p className="text-sm font-medium text-surface-700">
              {isDragOver ? 'Drop your PDF here' : 'Drag & drop your resume PDF'}
            </p>
            <p className="mt-1 text-xs text-surface-400">
              or click to browse (PDF, max 10 MB)
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
