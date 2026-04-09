'use client';

import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  MessageSquareText,
  Loader2,
} from 'lucide-react';
import { useActiveSection } from '@/hooks/useActiveSection';
import { useAISuggestions } from '@/hooks/useAISuggestions';
import { AISuggestionCard } from './AISuggestionCard';

// =============================================================================
// Section type labels for display
// =============================================================================

const SECTION_TYPE_LABELS: Record<string, string> = {
  summary: 'Professional Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  custom: 'Custom Section',
};

// =============================================================================
// Skeleton Card (loading placeholder)
// =============================================================================

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-surface-100 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-5 w-20 rounded-full loading-skeleton" />
        <div className="h-5 w-12 rounded loading-skeleton" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded loading-skeleton" />
        <div className="h-4 w-5/6 rounded loading-skeleton" />
        <div className="h-4 w-4/6 rounded loading-skeleton" />
      </div>
    </div>
  );
}

// =============================================================================
// AI Panel
// =============================================================================

export function AIPanel() {
  const { activeSectionId, activeSectionType, activeSectionContent } =
    useActiveSection();
  const { suggestions, isLoading, error, fetchSuggestions, clearSuggestions } =
    useAISuggestions();

  const hasActiveSection = activeSectionId !== null && activeSectionType !== null;
  const hasContent = activeSectionContent.trim().length > 0;
  const sectionLabel = activeSectionType
    ? SECTION_TYPE_LABELS[activeSectionType] ?? activeSectionType
    : null;

  return (
    <div className="flex h-full flex-col">
      {/* Panel Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-surface-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-100">
            <Sparkles className="h-3.5 w-3.5 text-primary-600" />
          </div>
          <h2 className="text-sm font-semibold text-surface-900">
            AI Suggestions
          </h2>
        </div>

        {suggestions.length > 0 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={clearSuggestions}
              className="rounded-lg px-2 py-1 text-xs font-medium text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600"
              aria-label="Clear suggestions"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={fetchSuggestions}
              disabled={isLoading}
              className="rounded-lg p-1.5 text-surface-400 transition-all duration-150 hover:bg-surface-100 hover:text-surface-600 disabled:opacity-50"
              aria-label="Regenerate suggestions"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Panel Content */}
      <div className="panel-scroll flex-1 p-4">
        {/* Context info: which section */}
        {hasActiveSection && (
          <div className="mb-4 rounded-lg bg-primary-50 px-3 py-2 border border-primary-100">
            <p className="text-xs font-medium text-primary-700">
              Editing: {sectionLabel}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
              <span className="text-sm text-surface-500">
                Generating suggestions...
              </span>
            </div>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">Error</span>
            </div>
            <p className="mb-3 text-sm text-red-600">{error}</p>
            {hasActiveSection && hasContent && (
              <button
                type="button"
                onClick={fetchSuggestions}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </button>
            )}
          </div>
        )}

        {/* Suggestions List */}
        {!isLoading && !error && suggestions.length > 0 && (
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <AISuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        )}

        {/* Empty State: No active section */}
        {!isLoading && !error && suggestions.length === 0 && !hasActiveSection && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 rounded-full bg-surface-100 p-3">
              <MessageSquareText className="h-6 w-6 text-surface-400" />
            </div>
            <p className="mb-1 text-sm font-medium text-surface-700">
              No section selected
            </p>
            <p className="text-xs text-surface-400 leading-relaxed">
              Click into a section in the editor to get AI-powered suggestions.
            </p>
          </div>
        )}

        {/* Empty State: Active section but no content */}
        {!isLoading &&
          !error &&
          suggestions.length === 0 &&
          hasActiveSection &&
          !hasContent && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 rounded-full bg-surface-100 p-3">
                <MessageSquareText className="h-6 w-6 text-surface-400" />
              </div>
              <p className="mb-1 text-sm font-medium text-surface-700">
                Start typing
              </p>
              <p className="text-xs text-surface-400 leading-relaxed">
                Add content to your {sectionLabel?.toLowerCase()} section, then
                generate suggestions.
              </p>
            </div>
          )}

        {/* Empty State: Active section with content, but no suggestions fetched yet */}
        {!isLoading &&
          !error &&
          suggestions.length === 0 &&
          hasActiveSection &&
          hasContent && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 rounded-full bg-primary-50 p-3">
                <Sparkles className="h-6 w-6 text-primary-500" />
              </div>
              <p className="mb-2 text-sm font-medium text-surface-700">
                Ready to improve
              </p>
              <p className="mb-4 text-xs text-surface-400 leading-relaxed">
                Get AI-powered suggestions for your {sectionLabel?.toLowerCase()}{' '}
                content.
              </p>
              <button
                type="button"
                onClick={fetchSuggestions}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-primary-700 hover:shadow-md active:bg-primary-800"
              >
                <Sparkles className="h-4 w-4" />
                Generate Suggestions
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
