'use client';

import { ChevronDown, ZoomIn, ZoomOut } from 'lucide-react';
import { useResumeData } from '@/hooks/useResumeData';
import { getAllTemplates } from '@/components/templates/registry';

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

interface PreviewControlsProps {
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
}

export function PreviewControls({ zoomLevel, onZoomChange }: PreviewControlsProps) {
  const { state, dispatch } = useResumeData();
  const templates = getAllTemplates();
  const currentTemplateId = state.meta.templateId;
  const currentTemplate = templates.find((t) => t.id === currentTemplateId);

  function handleTemplateChange(e: React.ChangeEvent<HTMLSelectElement>) {
    dispatch({
      type: 'SET_TEMPLATE',
      payload: { templateId: e.target.value },
    });
  }

  function handleZoomIn() {
    onZoomChange(Math.min(ZOOM_MAX, Math.round((zoomLevel + ZOOM_STEP) * 10) / 10));
  }

  function handleZoomOut() {
    onZoomChange(Math.max(ZOOM_MIN, Math.round((zoomLevel - ZOOM_STEP) * 10) / 10));
  }

  function handleZoomReset() {
    onZoomChange(1);
  }

  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-surface-200 bg-white px-4">
      <div className="flex items-center gap-2">
        <label
          htmlFor="template-select"
          className="text-xs font-medium text-surface-500 uppercase tracking-wide"
        >
          Template
        </label>
        <div className="relative">
          <select
            id="template-select"
            value={currentTemplateId}
            onChange={handleTemplateChange}
            className="appearance-none rounded-md border border-surface-200 bg-surface-50 py-1.5 pl-3 pr-8 text-sm font-medium text-surface-800 transition-all duration-150 hover:border-surface-300 hover:bg-surface-100 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            aria-label={`Current template: ${currentTemplate?.name ?? 'Classic'}`}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoomLevel <= ZOOM_MIN}
          className="rounded p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-surface-400"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomReset}
          className="min-w-[3.5rem] rounded px-1.5 py-1 text-center text-xs font-medium text-surface-600 transition-colors hover:bg-surface-100"
          aria-label="Reset zoom"
          title="Click to reset zoom"
        >
          {Math.round(zoomLevel * 100)}%
        </button>
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoomLevel >= ZOOM_MAX}
          className="rounded p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-surface-400"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
