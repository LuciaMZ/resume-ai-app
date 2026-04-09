'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useResumeData } from '@/hooks/useResumeData';
import { getTemplate } from '@/components/templates/registry';

// =============================================================================
// Constants
// =============================================================================

/** Width of US Letter at 96dpi (8.5in * 96) */
const PAGE_WIDTH = 816;

/** Height of US Letter at 96dpi (11in * 96) */
const PAGE_HEIGHT = 1056;

/** Debounce delay for preview updates (ms) */
const PREVIEW_DEBOUNCE = 150;

// =============================================================================
// Custom hook: debounced state
// =============================================================================

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// =============================================================================
// ResumePreview
// =============================================================================

interface ResumePreviewProps {
  zoomLevel?: number;
}

export function ResumePreview({ zoomLevel = 1 }: ResumePreviewProps) {
  const { state } = useResumeData();
  const containerRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [baseScale, setBaseScale] = useState(1);
  const [paperHeight, setPaperHeight] = useState(PAGE_HEIGHT);

  // Debounce the resume data to avoid re-rendering on every keystroke
  const debouncedState = useDebouncedValue(state, PREVIEW_DEBOUNCE);

  // Resolve template component
  const templateId = debouncedState.meta.templateId;
  const accentColor = debouncedState.meta.accentColor;
  const templateDef = useMemo(
    () => getTemplate(templateId) ?? getTemplate('classic'),
    [templateId]
  );
  const TemplateComponent = templateDef?.component;

  // The final scale is the fit-to-container base scale multiplied by user zoom
  const scale = baseScale * zoomLevel;

  // Calculate base scale based on container width
  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const availableWidth = containerWidth - 32;
    const newScale = Math.min(availableWidth / PAGE_WIDTH, 1);
    setBaseScale(newScale);
  }, []);

  // ResizeObserver for container width changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    updateScale();
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [updateScale]);

  // Measure paper height after content renders
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!paperRef.current) return;
      setPaperHeight(paperRef.current.scrollHeight);
    }, 50);
    return () => clearTimeout(timer);
  }, [debouncedState]);

  if (!TemplateComponent) {
    return (
      <div className="flex h-full items-center justify-center text-surface-400">
        <p className="text-sm">Template not found</p>
      </div>
    );
  }

  const pageCount = Math.max(1, Math.ceil(paperHeight / PAGE_HEIGHT));

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto py-6 px-4"
    >
      {/* Page count badge */}
      <div
        style={{
          width: `${PAGE_WIDTH * scale}px`,
          margin: '0 auto 8px',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <span
          style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }}
          className="bg-surface-100 text-surface-500 font-medium"
        >
          {pageCount} {pageCount === 1 ? 'page' : 'pages'}
        </span>
      </div>

      {/* Paper wrapper — sets scaled dimensions for scroll container */}
      <div
        style={{
          width: `${PAGE_WIDTH * scale}px`,
          height: `${paperHeight * scale}px`,
          flexShrink: 0,
          margin: '0 auto',
        }}
      >
        {/* Paper element — renders at full size, scaled via CSS transform */}
        <div
          ref={paperRef}
          style={{
            width: `${PAGE_WIDTH}px`,
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
          }}
          className="rounded-sm bg-white shadow-lg ring-1 ring-surface-200/80"
        >
          <TemplateComponent data={debouncedState} accentColor={accentColor} />
        </div>
      </div>
    </div>
  );
}

