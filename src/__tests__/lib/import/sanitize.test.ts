// =============================================================================
// Tests: HTML Sanitization (src/lib/import/sanitize.ts)
// =============================================================================
// The sanitizeResumeHTML function operates on ResumeData objects.
// In the jsdom test environment, DOMPurify may or may not be available.
// The code has a fallback regex-based sanitizer (stripDisallowedTags).
// We test through the public API: sanitizeResumeHTML.
// =============================================================================

import type { ResumeData } from '@/types/resume';
import { sanitizeResumeHTML } from '@/lib/import/sanitize';

// =============================================================================
// Helpers
// =============================================================================

function makeResumeWithHTML(htmlFields: {
  summaryContent?: string;
  experienceDescription?: string;
  educationDescription?: string;
  customDescription?: string;
}): ResumeData {
  const sections: ResumeData['sections'] = [];

  if (htmlFields.summaryContent !== undefined) {
    sections.push({
      id: 'sec-summary',
      type: 'summary',
      title: 'Summary',
      visible: true,
      order: 0,
      entries: [
        { id: 'entry-summary', type: 'summary', content: htmlFields.summaryContent },
      ],
    });
  }

  if (htmlFields.experienceDescription !== undefined) {
    sections.push({
      id: 'sec-exp',
      type: 'experience',
      title: 'Experience',
      visible: true,
      order: 1,
      entries: [
        {
          id: 'entry-exp',
          type: 'experience',
          jobTitle: 'Engineer',
          company: 'Corp',
          startDate: '2020-01',
          endDate: null,
          description: htmlFields.experienceDescription,
        },
      ],
    });
  }

  if (htmlFields.educationDescription !== undefined) {
    sections.push({
      id: 'sec-edu',
      type: 'education',
      title: 'Education',
      visible: true,
      order: 2,
      entries: [
        {
          id: 'entry-edu',
          type: 'education',
          institution: 'MIT',
          degree: 'BS',
          startDate: '2016-09',
          endDate: '2020-05',
          description: htmlFields.educationDescription,
        },
      ],
    });
  }

  if (htmlFields.customDescription !== undefined) {
    sections.push({
      id: 'sec-custom',
      type: 'custom',
      title: 'Other',
      visible: true,
      order: 3,
      entries: [
        {
          id: 'entry-custom',
          type: 'custom',
          description: htmlFields.customDescription,
        },
      ],
    });
  }

  return {
    meta: {
      id: 'meta-id',
      templateId: 'classic',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      schemaVersion: 1,
    },
    personalInfo: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '',
      location: '',
    },
    sections,
  };
}

function getSummaryContent(result: ResumeData): string {
  const section = result.sections.find((s) => s.type === 'summary');
  const entry = section?.entries[0];
  return entry?.type === 'summary' ? entry.content : '';
}

function getExperienceDescription(result: ResumeData): string {
  const section = result.sections.find((s) => s.type === 'experience');
  const entry = section?.entries[0];
  return entry?.type === 'experience' ? entry.description : '';
}

function getCustomDescription(result: ResumeData): string {
  const section = result.sections.find((s) => s.type === 'custom');
  const entry = section?.entries[0];
  return entry?.type === 'custom' ? entry.description : '';
}

// =============================================================================
// Tests
// =============================================================================

describe('sanitizeResumeHTML', () => {
  // --- Allowed tags pass through ---

  it('preserves <p> tags', () => {
    const input = makeResumeWithHTML({ summaryContent: '<p>Hello world</p>' });
    const result = sanitizeResumeHTML(input);
    expect(getSummaryContent(result)).toContain('<p>');
    expect(getSummaryContent(result)).toContain('Hello world');
  });

  it('preserves <ul>, <ol>, <li> tags', () => {
    const input = makeResumeWithHTML({
      experienceDescription: '<ul><li>Item 1</li><li>Item 2</li></ul>',
    });
    const result = sanitizeResumeHTML(input);
    const desc = getExperienceDescription(result);
    expect(desc).toContain('<ul>');
    expect(desc).toContain('<li>');
    expect(desc).toContain('Item 1');
  });

  it('preserves <strong>, <em>, <u> tags', () => {
    const input = makeResumeWithHTML({
      summaryContent: '<p><strong>Bold</strong> <em>italic</em> <u>underline</u></p>',
    });
    const result = sanitizeResumeHTML(input);
    const content = getSummaryContent(result);
    expect(content).toContain('<strong>');
    expect(content).toContain('<em>');
    expect(content).toContain('<u>');
  });

  it('preserves <a> tags with href', () => {
    const input = makeResumeWithHTML({
      summaryContent: '<p>Visit <a href="https://example.com">my site</a></p>',
    });
    const result = sanitizeResumeHTML(input);
    const content = getSummaryContent(result);
    expect(content).toContain('<a');
    expect(content).toContain('href=');
    expect(content).toContain('my site');
  });

  it('preserves <br> tags', () => {
    const input = makeResumeWithHTML({
      summaryContent: '<p>Line 1<br>Line 2</p>',
    });
    const result = sanitizeResumeHTML(input);
    const content = getSummaryContent(result);
    expect(content).toContain('<br');
  });

  // --- Disallowed tags are stripped ---

  it('strips <script> tags', () => {
    const input = makeResumeWithHTML({
      summaryContent: '<p>Hello</p><script>alert("xss")</script>',
    });
    const result = sanitizeResumeHTML(input);
    const content = getSummaryContent(result);
    expect(content).not.toContain('<script');
    expect(content).not.toContain('alert');
    expect(content).toContain('Hello');
  });

  it('strips <img> tags', () => {
    const input = makeResumeWithHTML({
      summaryContent: '<p>Before</p><img src="evil.jpg" onerror="alert(1)"><p>After</p>',
    });
    const result = sanitizeResumeHTML(input);
    const content = getSummaryContent(result);
    expect(content).not.toContain('<img');
    expect(content).not.toContain('evil.jpg');
    expect(content).toContain('Before');
    expect(content).toContain('After');
  });

  it('strips <div> tags', () => {
    const input = makeResumeWithHTML({
      summaryContent: '<div><p>Inside div</p></div>',
    });
    const result = sanitizeResumeHTML(input);
    const content = getSummaryContent(result);
    expect(content).not.toContain('<div');
    // The <p> inside should survive
    expect(content).toContain('<p>');
    expect(content).toContain('Inside div');
  });

  it('strips <span> tags', () => {
    const input = makeResumeWithHTML({
      summaryContent: '<p><span style="color:red">Styled</span> text</p>',
    });
    const result = sanitizeResumeHTML(input);
    const content = getSummaryContent(result);
    expect(content).not.toContain('<span');
    expect(content).toContain('Styled');
  });

  it('strips <style> tags', () => {
    const input = makeResumeWithHTML({
      summaryContent: '<style>body{color:red}</style><p>Text</p>',
    });
    const result = sanitizeResumeHTML(input);
    const content = getSummaryContent(result);
    expect(content).not.toContain('<style');
    expect(content).toContain('Text');
  });

  // --- Attributes stripping ---

  it('strips non-href attributes from <a> tags', () => {
    const input = makeResumeWithHTML({
      summaryContent: '<p><a href="https://example.com" onclick="alert(1)" target="_blank">Link</a></p>',
    });
    const result = sanitizeResumeHTML(input);
    const content = getSummaryContent(result);
    expect(content).not.toContain('onclick');
    // href should be kept
    expect(content).toContain('href');
  });

  it('strips style attributes from allowed tags', () => {
    const input = makeResumeWithHTML({
      summaryContent: '<p style="color:red;font-size:99px">Styled</p>',
    });
    const result = sanitizeResumeHTML(input);
    const content = getSummaryContent(result);
    expect(content).not.toContain('style=');
    expect(content).toContain('Styled');
  });

  // --- Plain text wrapping ---

  it('wraps plain text in <p> tags', () => {
    const input = makeResumeWithHTML({
      summaryContent: 'Just plain text without any HTML tags',
    });
    const result = sanitizeResumeHTML(input);
    const content = getSummaryContent(result);
    expect(content).toContain('<p>');
    expect(content).toContain('Just plain text');
  });

  it('does not double-wrap text that is already in <p> tags', () => {
    const input = makeResumeWithHTML({
      summaryContent: '<p>Already wrapped</p>',
    });
    const result = sanitizeResumeHTML(input);
    const content = getSummaryContent(result);
    // Should not have nested <p> tags
    expect(content).toBe('<p>Already wrapped</p>');
  });

  // --- XSS payloads ---

  it('sanitizes javascript: URLs', () => {
    const input = makeResumeWithHTML({
      summaryContent: '<p><a href="javascript:alert(1)">Click me</a></p>',
    });
    const result = sanitizeResumeHTML(input);
    const content = getSummaryContent(result);
    // Should either strip the href or the whole tag depending on implementation
    expect(content).not.toContain('javascript:');
  });

  it('sanitizes event handler attributes', () => {
    const input = makeResumeWithHTML({
      summaryContent: '<p onmouseover="alert(1)">Hover me</p>',
    });
    const result = sanitizeResumeHTML(input);
    const content = getSummaryContent(result);
    expect(content).not.toContain('onmouseover');
    expect(content).toContain('Hover me');
  });

  it('sanitizes data URIs in attributes', () => {
    const input = makeResumeWithHTML({
      summaryContent: '<p><a href="data:text/html,<script>alert(1)</script>">Link</a></p>',
    });
    const result = sanitizeResumeHTML(input);
    const content = getSummaryContent(result);
    expect(content).not.toContain('data:text/html');
  });

  // --- Nested HTML structures ---

  it('handles deeply nested allowed tags', () => {
    const input = makeResumeWithHTML({
      experienceDescription: '<ul><li><strong>Led</strong> <em>a team</em> of <u>5 engineers</u></li></ul>',
    });
    const result = sanitizeResumeHTML(input);
    const desc = getExperienceDescription(result);
    expect(desc).toContain('<ul>');
    expect(desc).toContain('<li>');
    expect(desc).toContain('<strong>');
    expect(desc).toContain('<em>');
    expect(desc).toContain('<u>');
  });

  it('strips disallowed tags while preserving their text content', () => {
    const input = makeResumeWithHTML({
      summaryContent: '<p>Normal <b>bold is ok</b> and <font color="red">colored text</font></p>',
    });
    const result = sanitizeResumeHTML(input);
    const content = getSummaryContent(result);
    expect(content).not.toContain('<font');
    expect(content).toContain('colored text');
  });

  // --- Does not mutate input ---

  it('returns a new object without mutating the input', () => {
    const input = makeResumeWithHTML({
      summaryContent: '<p>Original</p>',
    });
    const originalJSON = JSON.stringify(input);
    sanitizeResumeHTML(input);
    expect(JSON.stringify(input)).toBe(originalJSON);
  });

  // --- Skills entries pass through unchanged ---

  it('does not modify skills entries (no HTML fields)', () => {
    const input: ResumeData = {
      meta: {
        id: 'meta-id',
        templateId: 'classic',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        schemaVersion: 1,
      },
      personalInfo: { firstName: 'T', lastName: '', email: '', phone: '', location: '' },
      sections: [
        {
          id: 'sec-skills',
          type: 'skills',
          title: 'Skills',
          visible: true,
          order: 0,
          entries: [
            {
              id: 'entry-skills',
              type: 'skills',
              categories: [
                { id: 'cat-1', name: 'Languages', skills: ['TypeScript', 'Python'] },
              ],
            },
          ],
        },
      ],
    };

    const result = sanitizeResumeHTML(input);
    const skillsEntry = result.sections[0].entries[0];
    if (skillsEntry.type === 'skills') {
      expect(skillsEntry.categories).toHaveLength(1);
      expect(skillsEntry.categories[0].skills).toEqual(['TypeScript', 'Python']);
    }
  });

  // --- Empty string handling ---

  it('returns empty string for empty HTML fields', () => {
    const input = makeResumeWithHTML({
      customDescription: '',
    });
    const result = sanitizeResumeHTML(input);
    const desc = getCustomDescription(result);
    expect(desc).toBe('');
  });

  // --- Education description is optional ---

  it('handles undefined education description', () => {
    const input: ResumeData = {
      meta: {
        id: 'meta-id',
        templateId: 'classic',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        schemaVersion: 1,
      },
      personalInfo: { firstName: 'T', lastName: '', email: '', phone: '', location: '' },
      sections: [
        {
          id: 'sec-edu',
          type: 'education',
          title: 'Education',
          visible: true,
          order: 0,
          entries: [
            {
              id: 'entry-edu',
              type: 'education',
              institution: 'MIT',
              degree: 'BS',
              startDate: '2016-09',
              endDate: '2020-05',
              // description is intentionally omitted
            },
          ],
        },
      ],
    };

    const result = sanitizeResumeHTML(input);
    const entry = result.sections[0].entries[0];
    if (entry.type === 'education') {
      expect(entry.description).toBeUndefined();
    }
  });
});
