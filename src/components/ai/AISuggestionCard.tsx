'use client';

import { useState, useCallback } from 'react';
import { Copy, Check, WandSparkles } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useResumeData } from '@/hooks/useResumeData';
import { buildSuggestionPatch, suggestionTextToHtml } from '@/lib/ai';
import type { AISuggestion, SuggestionCategory } from '@/types/ai';

// =============================================================================
// Category Badge Config
// =============================================================================

const CATEGORY_STYLES: Record<
  SuggestionCategory,
  { bg: string; text: string; border: string; label: string }
> = {
  rewrite: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-l-blue-400',
    label: 'Rewrite',
  },
  'action-verb': {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-l-green-400',
    label: 'Action Verb',
  },
  quantify: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-l-purple-400',
    label: 'Quantify',
  },
  'ats-optimize': {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-l-amber-400',
    label: 'ATS Optimize',
  },
  concise: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-l-teal-400',
    label: 'Concise',
  },
};

// =============================================================================
// AI Suggestion Card
// =============================================================================

interface AISuggestionCardProps {
  suggestion: AISuggestion;
}

export function AISuggestionCard({ suggestion }: AISuggestionCardProps) {
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const { addToast } = useToast();
  const { state, dispatch } = useResumeData();

  const handleCopy = useCallback(async () => {
    const text = suggestion.suggestion;
    const html = suggestionTextToHtml(text);

    try {
      const blob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([text], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blob,
          'text/plain': textBlob,
        }),
      ]);
      setCopied(true);
      addToast('Copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      addToast('Copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [suggestion.suggestion, addToast]);

  const handleApply = useCallback(() => {
    const patch = buildSuggestionPatch(state, suggestion);
    if (!patch) {
      addToast(
        'Could not apply this suggestion to the current section state.',
        'error'
      );
      return;
    }

    dispatch({ type: 'APPLY_SUGGESTION', payload: patch });
    setApplied(true);
    addToast('Suggestion applied', 'success');
    setTimeout(() => setApplied(false), 2000);
  }, [state, suggestion, dispatch, addToast]);

  const categoryStyle =
    CATEGORY_STYLES[suggestion.category] ?? CATEGORY_STYLES.rewrite;

  return (
    <div
      className={`group relative rounded-xl border border-surface-200 border-l-[3px] ${categoryStyle.border} bg-white p-4 shadow-sm transition-all duration-150 hover:border-surface-300 hover:shadow-md`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text}`}
        >
          {categoryStyle.label}
        </span>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={handleApply}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 ${
              applied
                ? 'bg-green-50 text-green-600'
                : 'text-primary-600 hover:bg-primary-50'
            }`}
            aria-label={applied ? 'Applied' : 'Apply suggestion'}
          >
            {applied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Applied</span>
              </>
            ) : (
              <>
                <WandSparkles className="h-3.5 w-3.5" />
                <span>Apply</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 ${
              copied
                ? 'bg-green-50 text-green-600'
                : 'text-surface-400 hover:bg-surface-100 hover:text-surface-600'
            }`}
            aria-label={copied ? 'Copied' : 'Copy suggestion to clipboard'}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-surface-700">
        {suggestion.suggestion}
      </p>
    </div>
  );
}
