import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ResumeProvider } from '@/providers/ResumeProvider';
import { useResumeData } from '@/hooks/useResumeData';
import type { ResumeData, SectionEntry } from '@/types/resume';
import type { SuggestionPatch } from '@/types/ai';

/**
 * Helper: wraps the hook in a ResumeProvider so the context is available.
 */
function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(ResumeProvider, null, children);
}

/**
 * Helper: render the useResumeData hook inside a ResumeProvider.
 */
function renderResumeHook() {
  return renderHook(() => useResumeData(), { wrapper });
}

describe('resumeReducer (via useResumeData + ResumeProvider)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── 1. SET_PERSONAL_INFO ──────────────────────────────────────────────

  describe('SET_PERSONAL_INFO', () => {
    it('merges partial personal info into the state', () => {
      const { result } = renderResumeHook();

      act(() => {
        result.current.dispatch({
          type: 'SET_PERSONAL_INFO',
          payload: { firstName: 'Jane', lastName: 'Doe' },
        });
      });

      expect(result.current.state.personalInfo.firstName).toBe('Jane');
      expect(result.current.state.personalInfo.lastName).toBe('Doe');
    });

    it('preserves existing fields not included in the payload', () => {
      const { result } = renderResumeHook();

      act(() => {
        result.current.dispatch({
          type: 'SET_PERSONAL_INFO',
          payload: { email: 'jane@example.com' },
        });
      });

      // firstName should still be the default (empty string)
      expect(result.current.state.personalInfo.firstName).toBe('');
      expect(result.current.state.personalInfo.email).toBe('jane@example.com');
    });

    it('updates meta.updatedAt', () => {
      const { result } = renderResumeHook();
      const beforeUpdate = result.current.state.meta.updatedAt;

      vi.advanceTimersByTime(1000);

      act(() => {
        result.current.dispatch({
          type: 'SET_PERSONAL_INFO',
          payload: { firstName: 'Updated' },
        });
      });

      expect(result.current.state.meta.updatedAt).not.toBe(beforeUpdate);
    });
  });

  // ─── 2. ADD_SECTION ────────────────────────────────────────────────────

  describe('ADD_SECTION', () => {
    it('adds a new section with order equal to current sections length', () => {
      const { result } = renderResumeHook();
      const initialLength = result.current.state.sections.length;

      act(() => {
        result.current.dispatch({
          type: 'ADD_SECTION',
          payload: { type: 'custom', title: 'Projects' },
        });
      });

      const sections = result.current.state.sections;
      expect(sections).toHaveLength(initialLength + 1);

      const newSection = sections[sections.length - 1];
      expect(newSection.type).toBe('custom');
      expect(newSection.title).toBe('Projects');
      expect(newSection.visible).toBe(true);
      expect(newSection.order).toBe(initialLength);
    });

    it('creates a blank entry in the new section', () => {
      const { result } = renderResumeHook();

      act(() => {
        result.current.dispatch({
          type: 'ADD_SECTION',
          payload: { type: 'experience', title: 'More Experience' },
        });
      });

      const sections = result.current.state.sections;
      const newSection = sections[sections.length - 1];
      expect(newSection.entries).toHaveLength(1);
      expect(newSection.entries[0].type).toBe('experience');
    });

    it('updates meta.updatedAt', () => {
      const { result } = renderResumeHook();
      const before = result.current.state.meta.updatedAt;

      vi.advanceTimersByTime(1000);

      act(() => {
        result.current.dispatch({
          type: 'ADD_SECTION',
          payload: { type: 'custom', title: 'Awards' },
        });
      });

      expect(result.current.state.meta.updatedAt).not.toBe(before);
    });
  });

  // ─── 3. REMOVE_SECTION ────────────────────────────────────────────────

  describe('REMOVE_SECTION', () => {
    it('removes the section with the matching sectionId', () => {
      const { result } = renderResumeHook();
      const initialSections = result.current.state.sections;
      const sectionToRemove = initialSections[0];

      act(() => {
        result.current.dispatch({
          type: 'REMOVE_SECTION',
          payload: { sectionId: sectionToRemove.id },
        });
      });

      const remaining = result.current.state.sections;
      expect(remaining).toHaveLength(initialSections.length - 1);
      expect(remaining.find((s) => s.id === sectionToRemove.id)).toBeUndefined();
    });

    it('does not remove anything when sectionId does not match', () => {
      const { result } = renderResumeHook();
      const initialLength = result.current.state.sections.length;

      act(() => {
        result.current.dispatch({
          type: 'REMOVE_SECTION',
          payload: { sectionId: 'nonexistent-id' },
        });
      });

      expect(result.current.state.sections).toHaveLength(initialLength);
    });

    it('updates meta.updatedAt', () => {
      const { result } = renderResumeHook();
      const before = result.current.state.meta.updatedAt;
      const sectionId = result.current.state.sections[0].id;

      vi.advanceTimersByTime(1000);

      act(() => {
        result.current.dispatch({
          type: 'REMOVE_SECTION',
          payload: { sectionId },
        });
      });

      expect(result.current.state.meta.updatedAt).not.toBe(before);
    });
  });

  // ─── 4. UPDATE_SECTION ────────────────────────────────────────────────

  describe('UPDATE_SECTION', () => {
    it('merges updates into the matching section', () => {
      const { result } = renderResumeHook();
      const sectionId = result.current.state.sections[0].id;

      act(() => {
        result.current.dispatch({
          type: 'UPDATE_SECTION',
          payload: {
            sectionId,
            updates: { title: 'Renamed Section', visible: false },
          },
        });
      });

      const updated = result.current.state.sections.find(
        (s) => s.id === sectionId
      );
      expect(updated?.title).toBe('Renamed Section');
      expect(updated?.visible).toBe(false);
    });

    it('does not modify other sections', () => {
      const { result } = renderResumeHook();
      const sectionId = result.current.state.sections[0].id;
      const otherSection = result.current.state.sections[1];

      act(() => {
        result.current.dispatch({
          type: 'UPDATE_SECTION',
          payload: {
            sectionId,
            updates: { title: 'Changed' },
          },
        });
      });

      const otherAfter = result.current.state.sections.find(
        (s) => s.id === otherSection.id
      );
      expect(otherAfter?.title).toBe(otherSection.title);
    });

    it('updates meta.updatedAt', () => {
      const { result } = renderResumeHook();
      const before = result.current.state.meta.updatedAt;
      const sectionId = result.current.state.sections[0].id;

      vi.advanceTimersByTime(1000);

      act(() => {
        result.current.dispatch({
          type: 'UPDATE_SECTION',
          payload: { sectionId, updates: { title: 'New Title' } },
        });
      });

      expect(result.current.state.meta.updatedAt).not.toBe(before);
    });
  });

  // ─── 5. REORDER_SECTIONS ──────────────────────────────────────────────

  describe('REORDER_SECTIONS', () => {
    it('reorders sections by the provided ID array and updates order fields', () => {
      const { result } = renderResumeHook();
      const sections = result.current.state.sections;
      // Reverse the order
      const reversedIds = [...sections].reverse().map((s) => s.id);

      act(() => {
        result.current.dispatch({
          type: 'REORDER_SECTIONS',
          payload: { sectionIds: reversedIds },
        });
      });

      const reordered = result.current.state.sections;
      expect(reordered.map((s) => s.id)).toEqual(reversedIds);
      reordered.forEach((s, index) => {
        expect(s.order).toBe(index);
      });
    });

    it('filters out IDs that do not match any section', () => {
      const { result } = renderResumeHook();
      const sections = result.current.state.sections;
      const validIds = sections.map((s) => s.id);

      act(() => {
        result.current.dispatch({
          type: 'REORDER_SECTIONS',
          payload: { sectionIds: ['fake-id', ...validIds] },
        });
      });

      // The fake id is filtered out, so length should be same as original
      expect(result.current.state.sections).toHaveLength(validIds.length);
    });

    it('preserves sections omitted from payload and appends them after reordered IDs', () => {
      const { result } = renderResumeHook();
      const [first, second, third, fourth] = result.current.state.sections;

      act(() => {
        result.current.dispatch({
          type: 'REORDER_SECTIONS',
          payload: { sectionIds: [third.id, first.id] },
        });
      });

      const reordered = result.current.state.sections.map((s) => s.id);
      expect(reordered).toEqual([third.id, first.id, second.id, fourth.id]);
      result.current.state.sections.forEach((section, index) => {
        expect(section.order).toBe(index);
      });
    });

    it('updates meta.updatedAt', () => {
      const { result } = renderResumeHook();
      const before = result.current.state.meta.updatedAt;
      const sectionIds = result.current.state.sections.map((s) => s.id);

      vi.advanceTimersByTime(1000);

      act(() => {
        result.current.dispatch({
          type: 'REORDER_SECTIONS',
          payload: { sectionIds },
        });
      });

      expect(result.current.state.meta.updatedAt).not.toBe(before);
    });
  });

  // ─── 6. ADD_ENTRY ─────────────────────────────────────────────────────

  describe('ADD_ENTRY', () => {
    it('adds an entry to the matching section', () => {
      const { result } = renderResumeHook();
      // Find the experience section
      const experienceSection = result.current.state.sections.find(
        (s) => s.type === 'experience'
      )!;
      const initialEntryCount = experienceSection.entries.length;

      const newEntry: SectionEntry = {
        id: 'new-entry-1',
        type: 'experience',
        jobTitle: 'Frontend Dev',
        company: 'Test Corp',
        location: 'Remote',
        startDate: '2023-01',
        endDate: null,
        description: '<p>Did things</p>',
      };

      act(() => {
        result.current.dispatch({
          type: 'ADD_ENTRY',
          payload: { sectionId: experienceSection.id, entry: newEntry },
        });
      });

      const updated = result.current.state.sections.find(
        (s) => s.id === experienceSection.id
      )!;
      expect(updated.entries).toHaveLength(initialEntryCount + 1);
      expect(updated.entries[updated.entries.length - 1].id).toBe('new-entry-1');
    });

    it('does not affect other sections', () => {
      const { result } = renderResumeHook();
      const experienceSection = result.current.state.sections.find(
        (s) => s.type === 'experience'
      )!;
      const summarySection = result.current.state.sections.find(
        (s) => s.type === 'summary'
      )!;
      const summaryEntryCount = summarySection.entries.length;

      const newEntry: SectionEntry = {
        id: 'new-entry-2',
        type: 'experience',
        jobTitle: 'Backend Dev',
        company: 'Other Corp',
        location: 'NYC',
        startDate: '2022-06',
        endDate: '2023-01',
        description: '<p>Built APIs</p>',
      };

      act(() => {
        result.current.dispatch({
          type: 'ADD_ENTRY',
          payload: { sectionId: experienceSection.id, entry: newEntry },
        });
      });

      const summaryAfter = result.current.state.sections.find(
        (s) => s.id === summarySection.id
      )!;
      expect(summaryAfter.entries).toHaveLength(summaryEntryCount);
    });

    it('updates meta.updatedAt', () => {
      const { result } = renderResumeHook();
      const before = result.current.state.meta.updatedAt;
      const sectionId = result.current.state.sections[0].id;

      vi.advanceTimersByTime(1000);

      const newEntry: SectionEntry = {
        id: 'timestamp-entry',
        type: 'summary',
        content: 'test',
      };

      act(() => {
        result.current.dispatch({
          type: 'ADD_ENTRY',
          payload: { sectionId, entry: newEntry },
        });
      });

      expect(result.current.state.meta.updatedAt).not.toBe(before);
    });
  });

  // ─── 7. UPDATE_ENTRY ──────────────────────────────────────────────────

  describe('UPDATE_ENTRY', () => {
    it('merges updates into the matching entry', () => {
      const { result } = renderResumeHook();
      const experienceSection = result.current.state.sections.find(
        (s) => s.type === 'experience'
      )!;
      const entryId = experienceSection.entries[0].id;

      act(() => {
        result.current.dispatch({
          type: 'UPDATE_ENTRY',
          payload: {
            sectionId: experienceSection.id,
            entryId,
            updates: { jobTitle: 'Lead Engineer', company: 'New Corp' },
          },
        });
      });

      const updatedSection = result.current.state.sections.find(
        (s) => s.id === experienceSection.id
      )!;
      const updatedEntry = updatedSection.entries.find((e) => e.id === entryId)!;
      expect((updatedEntry as Record<string, unknown>).jobTitle).toBe('Lead Engineer');
      expect((updatedEntry as Record<string, unknown>).company).toBe('New Corp');
    });

    it('preserves fields not included in updates', () => {
      const { result } = renderResumeHook();
      const experienceSection = result.current.state.sections.find(
        (s) => s.type === 'experience'
      )!;
      const entry = experienceSection.entries[0];
      const originalDescription = (entry as Record<string, unknown>).description;

      act(() => {
        result.current.dispatch({
          type: 'UPDATE_ENTRY',
          payload: {
            sectionId: experienceSection.id,
            entryId: entry.id,
            updates: { jobTitle: 'Changed Title' },
          },
        });
      });

      const updatedSection = result.current.state.sections.find(
        (s) => s.id === experienceSection.id
      )!;
      const updatedEntry = updatedSection.entries.find((e) => e.id === entry.id)!;
      expect((updatedEntry as Record<string, unknown>).description).toBe(
        originalDescription
      );
    });

    it('updates meta.updatedAt', () => {
      const { result } = renderResumeHook();
      const before = result.current.state.meta.updatedAt;
      const section = result.current.state.sections.find(
        (s) => s.type === 'experience'
      )!;

      vi.advanceTimersByTime(1000);

      act(() => {
        result.current.dispatch({
          type: 'UPDATE_ENTRY',
          payload: {
            sectionId: section.id,
            entryId: section.entries[0].id,
            updates: { jobTitle: 'Timestamped' },
          },
        });
      });

      expect(result.current.state.meta.updatedAt).not.toBe(before);
    });
  });

  // ─── 8. REMOVE_ENTRY ──────────────────────────────────────────────────

  describe('REMOVE_ENTRY', () => {
    it('removes the entry with the matching entryId from the section', () => {
      const { result } = renderResumeHook();
      const experienceSection = result.current.state.sections.find(
        (s) => s.type === 'experience'
      )!;
      const entryId = experienceSection.entries[0].id;

      act(() => {
        result.current.dispatch({
          type: 'REMOVE_ENTRY',
          payload: { sectionId: experienceSection.id, entryId },
        });
      });

      const updatedSection = result.current.state.sections.find(
        (s) => s.id === experienceSection.id
      )!;
      expect(
        updatedSection.entries.find((e) => e.id === entryId)
      ).toBeUndefined();
    });

    it('does not remove entries from other sections', () => {
      const { result } = renderResumeHook();
      const summarySection = result.current.state.sections.find(
        (s) => s.type === 'summary'
      )!;
      const experienceSection = result.current.state.sections.find(
        (s) => s.type === 'experience'
      )!;
      const summaryEntryCount = summarySection.entries.length;

      act(() => {
        result.current.dispatch({
          type: 'REMOVE_ENTRY',
          payload: {
            sectionId: experienceSection.id,
            entryId: experienceSection.entries[0].id,
          },
        });
      });

      const summaryAfter = result.current.state.sections.find(
        (s) => s.id === summarySection.id
      )!;
      expect(summaryAfter.entries).toHaveLength(summaryEntryCount);
    });

    it('updates meta.updatedAt', () => {
      const { result } = renderResumeHook();
      const before = result.current.state.meta.updatedAt;
      const section = result.current.state.sections.find(
        (s) => s.type === 'experience'
      )!;

      vi.advanceTimersByTime(1000);

      act(() => {
        result.current.dispatch({
          type: 'REMOVE_ENTRY',
          payload: {
            sectionId: section.id,
            entryId: section.entries[0].id,
          },
        });
      });

      expect(result.current.state.meta.updatedAt).not.toBe(before);
    });
  });

  // ─── 9. REORDER_ENTRIES ───────────────────────────────────────────────

  describe('REORDER_ENTRIES', () => {
    it('reorders entries within a section by the provided ID array', () => {
      const { result } = renderResumeHook();

      // First, add a second entry to experience so we have something to reorder
      const experienceSection = result.current.state.sections.find(
        (s) => s.type === 'experience'
      )!;

      const secondEntry: SectionEntry = {
        id: 'second-exp-entry',
        type: 'experience',
        jobTitle: 'Junior Dev',
        company: 'Startup Inc',
        location: 'Austin, TX',
        startDate: '2019-01',
        endDate: '2021-05',
        description: '<p>Learned a lot</p>',
      };

      act(() => {
        result.current.dispatch({
          type: 'ADD_ENTRY',
          payload: { sectionId: experienceSection.id, entry: secondEntry },
        });
      });

      const sectionAfterAdd = result.current.state.sections.find(
        (s) => s.id === experienceSection.id
      )!;
      const originalFirstId = sectionAfterAdd.entries[0].id;
      const originalSecondId = sectionAfterAdd.entries[1].id;

      // Reverse the order
      act(() => {
        result.current.dispatch({
          type: 'REORDER_ENTRIES',
          payload: {
            sectionId: experienceSection.id,
            entryIds: [originalSecondId, originalFirstId],
          },
        });
      });

      const reordered = result.current.state.sections.find(
        (s) => s.id === experienceSection.id
      )!;
      expect(reordered.entries[0].id).toBe(originalSecondId);
      expect(reordered.entries[1].id).toBe(originalFirstId);
    });

    it('filters out entry IDs that do not exist in the section', () => {
      const { result } = renderResumeHook();
      const section = result.current.state.sections.find(
        (s) => s.type === 'experience'
      )!;
      const validEntryId = section.entries[0].id;

      act(() => {
        result.current.dispatch({
          type: 'REORDER_ENTRIES',
          payload: {
            sectionId: section.id,
            entryIds: ['fake-entry', validEntryId],
          },
        });
      });

      const updated = result.current.state.sections.find(
        (s) => s.id === section.id
      )!;
      expect(updated.entries).toHaveLength(1);
      expect(updated.entries[0].id).toBe(validEntryId);
    });

    it('preserves entries omitted from payload and appends them after reordered IDs', () => {
      const { result } = renderResumeHook();
      const section = result.current.state.sections.find(
        (s) => s.type === 'experience'
      )!;

      const secondEntry: SectionEntry = {
        id: 'extra-exp-entry-1',
        type: 'experience',
        jobTitle: 'Engineer II',
        company: 'Example Inc',
        location: 'Remote',
        startDate: '2021-01',
        endDate: '2022-01',
        description: '<p>Built features</p>',
      };
      const thirdEntry: SectionEntry = {
        id: 'extra-exp-entry-2',
        type: 'experience',
        jobTitle: 'Engineer III',
        company: 'Example Inc',
        location: 'Remote',
        startDate: '2022-02',
        endDate: null,
        description: '<p>Led projects</p>',
      };

      act(() => {
        result.current.dispatch({
          type: 'ADD_ENTRY',
          payload: { sectionId: section.id, entry: secondEntry },
        });
        result.current.dispatch({
          type: 'ADD_ENTRY',
          payload: { sectionId: section.id, entry: thirdEntry },
        });
      });

      const withExtras = result.current.state.sections.find(
        (s) => s.id === section.id
      )!;
      const [first, second, third] = withExtras.entries;

      act(() => {
        result.current.dispatch({
          type: 'REORDER_ENTRIES',
          payload: {
            sectionId: section.id,
            entryIds: [third.id],
          },
        });
      });

      const reordered = result.current.state.sections.find(
        (s) => s.id === section.id
      )!;
      expect(reordered.entries.map((e) => e.id)).toEqual([
        third.id,
        first.id,
        second.id,
      ]);
    });

    it('updates meta.updatedAt', () => {
      const { result } = renderResumeHook();
      const before = result.current.state.meta.updatedAt;
      const section = result.current.state.sections.find(
        (s) => s.type === 'experience'
      )!;

      vi.advanceTimersByTime(1000);

      act(() => {
        result.current.dispatch({
          type: 'REORDER_ENTRIES',
          payload: {
            sectionId: section.id,
            entryIds: section.entries.map((e) => e.id),
          },
        });
      });

      expect(result.current.state.meta.updatedAt).not.toBe(before);
    });
  });

  // ─── 10. SET_TEMPLATE ──────────────────────────────────────────────────

  describe('APPLY_SUGGESTION', () => {
    it('applies a summary suggestion patch to the targeted entry', () => {
      const { result } = renderResumeHook();
      const summarySection = result.current.state.sections.find(
        (s) => s.type === 'summary'
      )!;
      const summaryEntry = summarySection.entries.find(
        (e) => e.type === 'summary'
      )!;

      const patch: SuggestionPatch = {
        sectionId: summarySection.id,
        sectionType: 'summary',
        entryId: summaryEntry.id,
        updates: { content: '<p>Improved summary text</p>' },
      };

      act(() => {
        result.current.dispatch({
          type: 'APPLY_SUGGESTION',
          payload: patch,
        });
      });

      const updatedSection = result.current.state.sections.find(
        (s) => s.id === summarySection.id
      )!;
      const updatedEntry = updatedSection.entries.find(
        (e) => e.id === summaryEntry.id
      ) as { content: string };
      expect(updatedEntry.content).toBe('<p>Improved summary text</p>');
    });

    it('applies an experience suggestion patch to description only', () => {
      const { result } = renderResumeHook();
      const experienceSection = result.current.state.sections.find(
        (s) => s.type === 'experience'
      )!;
      const experienceEntry = experienceSection.entries.find(
        (e) => e.type === 'experience'
      ) as {
        id: string;
        description: string;
        jobTitle: string;
      };

      const originalTitle = experienceEntry.jobTitle;
      const patch: SuggestionPatch = {
        sectionId: experienceSection.id,
        sectionType: 'experience',
        entryId: experienceEntry.id,
        updates: { description: '<ul><li>Improved bullet</li></ul>' },
      };

      act(() => {
        result.current.dispatch({
          type: 'APPLY_SUGGESTION',
          payload: patch,
        });
      });

      const updatedSection = result.current.state.sections.find(
        (s) => s.id === experienceSection.id
      )!;
      const updatedEntry = updatedSection.entries.find(
        (e) => e.id === experienceEntry.id
      ) as { description: string; jobTitle: string };

      expect(updatedEntry.description).toBe('<ul><li>Improved bullet</li></ul>');
      expect(updatedEntry.jobTitle).toBe(originalTitle);
    });

    it('does not mutate entries when section type in patch does not match section', () => {
      const { result } = renderResumeHook();
      const summarySection = result.current.state.sections.find(
        (s) => s.type === 'summary'
      )!;
      const summaryEntry = summarySection.entries.find(
        (e) => e.type === 'summary'
      ) as { id: string; content: string };
      const originalContent = summaryEntry.content;

      const badPatch: SuggestionPatch = {
        sectionId: summarySection.id,
        sectionType: 'experience',
        entryId: summaryEntry.id,
        updates: { description: '<p>Should not apply</p>' },
      };

      act(() => {
        result.current.dispatch({
          type: 'APPLY_SUGGESTION',
          payload: badPatch,
        });
      });

      const sectionAfter = result.current.state.sections.find(
        (s) => s.id === summarySection.id
      )!;
      const entryAfter = sectionAfter.entries.find(
        (e) => e.id === summaryEntry.id
      ) as { content: string };
      expect(entryAfter.content).toBe(originalContent);
    });

    it('updates meta.updatedAt', () => {
      const { result } = renderResumeHook();
      const before = result.current.state.meta.updatedAt;
      const summarySection = result.current.state.sections.find(
        (s) => s.type === 'summary'
      )!;
      const summaryEntry = summarySection.entries.find(
        (e) => e.type === 'summary'
      )!;

      vi.advanceTimersByTime(1000);

      const patch: SuggestionPatch = {
        sectionId: summarySection.id,
        sectionType: 'summary',
        entryId: summaryEntry.id,
        updates: { content: '<p>New text</p>' },
      };

      act(() => {
        result.current.dispatch({
          type: 'APPLY_SUGGESTION',
          payload: patch,
        });
      });

      expect(result.current.state.meta.updatedAt).not.toBe(before);
    });
  });

  describe('SET_TEMPLATE', () => {
    it('updates meta.templateId', () => {
      const { result } = renderResumeHook();

      act(() => {
        result.current.dispatch({
          type: 'SET_TEMPLATE',
          payload: { templateId: 'modern' },
        });
      });

      expect(result.current.state.meta.templateId).toBe('modern');
    });

    it('preserves other meta fields', () => {
      const { result } = renderResumeHook();
      const originalId = result.current.state.meta.id;
      const originalCreatedAt = result.current.state.meta.createdAt;

      act(() => {
        result.current.dispatch({
          type: 'SET_TEMPLATE',
          payload: { templateId: 'minimal' },
        });
      });

      expect(result.current.state.meta.id).toBe(originalId);
      expect(result.current.state.meta.createdAt).toBe(originalCreatedAt);
    });

    it('updates meta.updatedAt', () => {
      const { result } = renderResumeHook();
      const before = result.current.state.meta.updatedAt;

      vi.advanceTimersByTime(1000);

      act(() => {
        result.current.dispatch({
          type: 'SET_TEMPLATE',
          payload: { templateId: 'fancy' },
        });
      });

      expect(result.current.state.meta.updatedAt).not.toBe(before);
    });
  });

  // ─── 11. LOAD_RESUME ──────────────────────────────────────────────────

  describe('LOAD_RESUME', () => {
    it('replaces the entire state with the provided payload', () => {
      const { result } = renderResumeHook();

      const customResume: ResumeData = {
        meta: {
          id: 'custom-id',
          templateId: 'loaded-template',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-06-15T12:00:00.000Z',
          schemaVersion: 1,
        },
        personalInfo: {
          firstName: 'Loaded',
          lastName: 'User',
          email: 'loaded@example.com',
          phone: '555-0000',
          location: 'Loaded City',
        },
        sections: [],
      };

      act(() => {
        result.current.dispatch({
          type: 'LOAD_RESUME',
          payload: customResume,
        });
      });

      expect(result.current.state).toEqual(customResume);
    });

    it('does not modify the payload (no updatedAt mutation)', () => {
      const { result } = renderResumeHook();

      const customResume: ResumeData = {
        meta: {
          id: 'exact-id',
          templateId: 'exact-template',
          createdAt: '2020-01-01T00:00:00.000Z',
          updatedAt: '2020-01-01T00:00:00.000Z',
          schemaVersion: 1,
        },
        personalInfo: {
          firstName: 'Exact',
          lastName: 'Match',
          email: 'exact@test.com',
          phone: '000',
          location: 'Nowhere',
        },
        sections: [],
      };

      act(() => {
        result.current.dispatch({
          type: 'LOAD_RESUME',
          payload: customResume,
        });
      });

      // updatedAt should be exactly what was in the payload, not auto-updated
      expect(result.current.state.meta.updatedAt).toBe(
        '2020-01-01T00:00:00.000Z'
      );
    });
  });

  // ─── 12. RESET_RESUME ─────────────────────────────────────────────────

  describe('RESET_RESUME', () => {
    it('resets the state to default resume data', () => {
      const { result } = renderResumeHook();

      // Modify state first
      act(() => {
        result.current.dispatch({
          type: 'SET_PERSONAL_INFO',
          payload: { firstName: 'Modified', lastName: 'State' },
        });
      });

      expect(result.current.state.personalInfo.firstName).toBe('Modified');

      // Reset
      act(() => {
        result.current.dispatch({ type: 'RESET_RESUME' });
      });

      // After reset, personal info should be back to defaults (empty strings)
      expect(result.current.state.personalInfo.firstName).toBe('');
      expect(result.current.state.personalInfo.lastName).toBe('');
    });

    it('produces default data with 4 sections', () => {
      const { result } = renderResumeHook();

      // Remove all sections first
      const sectionIds = result.current.state.sections.map((s) => s.id);
      sectionIds.forEach((id) => {
        act(() => {
          result.current.dispatch({
            type: 'REMOVE_SECTION',
            payload: { sectionId: id },
          });
        });
      });

      expect(result.current.state.sections).toHaveLength(0);

      // Reset
      act(() => {
        result.current.dispatch({ type: 'RESET_RESUME' });
      });

      expect(result.current.state.sections).toHaveLength(4);

      const types = result.current.state.sections.map((s) => s.type);
      expect(types).toContain('summary');
      expect(types).toContain('experience');
      expect(types).toContain('education');
      expect(types).toContain('skills');
    });

    it('resets the template to classic', () => {
      const { result } = renderResumeHook();

      act(() => {
        result.current.dispatch({
          type: 'SET_TEMPLATE',
          payload: { templateId: 'custom-template' },
        });
      });

      expect(result.current.state.meta.templateId).toBe('custom-template');

      act(() => {
        result.current.dispatch({ type: 'RESET_RESUME' });
      });

      expect(result.current.state.meta.templateId).toBe('classic');
    });

    it('generates fresh IDs on reset (not reusing old ones)', () => {
      const { result } = renderResumeHook();
      const originalMetaId = result.current.state.meta.id;

      act(() => {
        result.current.dispatch({ type: 'RESET_RESUME' });
      });

      // createDefaultResumeData() generates new UUIDs, so IDs should differ
      expect(result.current.state.meta.id).not.toBe(originalMetaId);
    });
  });

  // ─── Default / unknown action ──────────────────────────────────────────

  describe('default case', () => {
    it('returns the same state for an unknown action type', () => {
      const { result } = renderResumeHook();
      const stateBefore = result.current.state;

      act(() => {
        // Force an unknown action type
        result.current.dispatch({
          type: 'UNKNOWN_ACTION' as never,
        } as never);
      });

      expect(result.current.state).toBe(stateBefore);
    });
  });

  // ─── Initial state ────────────────────────────────────────────────────

  describe('initial state', () => {
    it('initializes with default resume data when localStorage is empty', () => {
      const { result } = renderResumeHook();
      const state = result.current.state;

      expect(state.meta).toBeDefined();
      expect(state.meta.templateId).toBe('classic');
      expect(state.meta.schemaVersion).toBe(1);
      expect(state.personalInfo).toBeDefined();
      expect(state.sections).toHaveLength(4);
    });

    it('provides a dispatch function', () => {
      const { result } = renderResumeHook();
      expect(typeof result.current.dispatch).toBe('function');
    });
  });
});
