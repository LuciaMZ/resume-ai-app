import { format, parse } from 'date-fns';
import type { ResumeData, ResumeSection } from '@/types/resume';

/**
 * Format a "YYYY-MM" date string to "MMM yyyy" (e.g., "Jun 2021").
 * Returns empty string if the input is empty or malformed.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '') return '';
  try {
    const parsed = parse(dateStr, 'yyyy-MM', new Date());
    return format(parsed, 'MMM yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Build a date range string from startDate and endDate.
 * - Both empty: returns ''
 * - Only start: "Jun 2021"
 * - Start + end: "Jun 2021 - May 2023"
 * - Start + null end: "Jun 2021 - Present"
 */
export function formatDateRange(
  startDate: string,
  endDate: string | null | undefined
): string {
  const start = formatDate(startDate);
  if (!start) return '';

  if (endDate === null) return `${start} - Present`;
  if (endDate === undefined || endDate === '') return start;

  const end = formatDate(endDate);
  return end ? `${start} - ${end}` : start;
}

/**
 * Build a full name from personalInfo first/last name.
 */
export function buildFullName(data: ResumeData): string {
  return [data.personalInfo.firstName, data.personalInfo.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
}

/**
 * Get visible sections sorted by order.
 */
export function getVisibleSections(sections: ResumeSection[]): ResumeSection[] {
  return sections
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);
}

/**
 * Check if a Tiptap HTML string is effectively empty.
 */
export function isEmptyHTML(html: string | undefined | null): boolean {
  if (!html) return true;
  return html === '<p></p>' || html.trim() === '';
}
