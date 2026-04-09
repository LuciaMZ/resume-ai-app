'use client';

import type { RefObject } from 'react';
import { useResumeData } from '@/hooks/useResumeData';
import { getTemplate } from '@/components/templates/registry';

// =============================================================================
// PrintTarget
// =============================================================================

interface PrintTargetProps {
  /** Ref from usePDFExport — attached to the print container */
  contentRef: RefObject<HTMLDivElement | null>;
}

/**
 * Hidden container that renders the resume template at full, unscaled
 * print dimensions. This component is invisible on screen but becomes
 * the sole visible element during printing via @media print rules.
 *
 * Key differences from ResumePreview:
 * - No CSS transform/scale — renders at true 1:1 dimensions
 * - Positioned off-screen (not display:none, which prevents printing)
 * - Has id="resume-print-target" to match print stylesheet selectors
 */
export function PrintTarget({ contentRef }: PrintTargetProps) {
  const { state } = useResumeData();

  // Resolve template
  const templateId = state.meta.templateId;
  const accentColor = state.meta.accentColor;
  const templateDef = getTemplate(templateId) ?? getTemplate('classic');
  const TemplateComponent = templateDef?.component;

  if (!TemplateComponent) {
    return null;
  }

  return (
    <div
      id="resume-print-target"
      ref={contentRef}
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 0,
        width: '816px', // 8.5in at 96dpi — matches ClassicTemplate
        overflow: 'visible',
      }}
      aria-hidden="true"
    >
      <TemplateComponent data={state} accentColor={accentColor} />
    </div>
  );
}
