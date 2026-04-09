// =============================================================================
// Tests: Resume Data Validation & Fixing (src/lib/import/validate.ts)
// =============================================================================

import { ValidationError } from '@/lib/import/errors';

// Mock generateId to return incrementing IDs for predictable testing
let idCounter = 0;
vi.mock('@/lib/uuid', () => ({
  generateId: vi.fn(() => `test-id-${++idCounter}`),
}));

import { validateAndFixResumeData } from '@/lib/import/validate';

// =============================================================================
// Helpers
// =============================================================================

function makeValidAIOutput() {
  return {
    meta: {
      id: 'ai-generated-id',
      templateId: 'classic',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      schemaVersion: 1,
    },
    personalInfo: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: '555-9876',
      location: 'New York, NY',
      website: 'https://janesmith.dev',
      linkedIn: 'https://linkedin.com/in/janesmith',
    },
    sections: [
      {
        id: 'ai-sec-1',
        type: 'summary',
        title: 'Professional Summary',
        visible: true,
        order: 0,
        entries: [
          {
            id: 'ai-entry-1',
            type: 'summary',
            content: '<p>Experienced developer.</p>',
          },
        ],
      },
      {
        id: 'ai-sec-2',
        type: 'experience',
        title: 'Work Experience',
        visible: true,
        order: 1,
        entries: [
          {
            id: 'ai-entry-2',
            type: 'experience',
            jobTitle: 'Senior Engineer',
            company: 'TechCorp',
            location: 'NYC',
            startDate: '2020-03',
            endDate: null,
            description: '<ul><li>Led team of 5</li></ul>',
          },
        ],
      },
      {
        id: 'ai-sec-3',
        type: 'education',
        title: 'Education',
        visible: true,
        order: 2,
        entries: [
          {
            id: 'ai-entry-3',
            type: 'education',
            institution: 'MIT',
            degree: 'BS Computer Science',
            field: 'Computer Science',
            startDate: '2012-09',
            endDate: '2016-05',
          },
        ],
      },
      {
        id: 'ai-sec-4',
        type: 'skills',
        title: 'Skills',
        visible: true,
        order: 3,
        entries: [
          {
            id: 'ai-entry-4',
            type: 'skills',
            categories: [
              { id: 'ai-cat-1', name: 'Languages', skills: ['TypeScript', 'Python'] },
            ],
          },
        ],
      },
      {
        id: 'ai-sec-5',
        type: 'custom',
        title: 'Certifications',
        visible: true,
        order: 4,
        entries: [
          {
            id: 'ai-entry-5',
            type: 'custom',
            title: 'AWS Solutions Architect',
            subtitle: 'Amazon',
            startDate: '2022-01',
            endDate: null,
            description: '<p>Professional certification.</p>',
          },
        ],
      },
    ],
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('validateAndFixResumeData', () => {
  beforeEach(() => {
    idCounter = 0;
  });

  // --- Valid data passes through ---

  it('accepts valid ResumeData and returns well-formed output', () => {
    const input = makeValidAIOutput();
    const result = validateAndFixResumeData(input);

    expect(result.personalInfo.firstName).toBe('Jane');
    expect(result.personalInfo.lastName).toBe('Smith');
    expect(result.personalInfo.email).toBe('jane@example.com');
    expect(result.sections).toHaveLength(5);
  });

  // --- Missing optional fields are coerced to defaults ---

  it('coerces missing personalInfo optional fields to undefined', () => {
    const input = makeValidAIOutput();
    delete (input.personalInfo as Record<string, unknown>).website;
    delete (input.personalInfo as Record<string, unknown>).linkedIn;

    const result = validateAndFixResumeData(input);

    expect(result.personalInfo.website).toBeUndefined();
    expect(result.personalInfo.linkedIn).toBeUndefined();
  });

  it('coerces missing required string fields to empty string', () => {
    const input = makeValidAIOutput();
    delete (input.personalInfo as Record<string, unknown>).phone;
    delete (input.personalInfo as Record<string, unknown>).location;

    const result = validateAndFixResumeData(input);

    expect(result.personalInfo.phone).toBe('');
    expect(result.personalInfo.location).toBe('');
  });

  it('coerces non-string fields to empty strings', () => {
    const input = makeValidAIOutput();
    (input.personalInfo as Record<string, unknown>).firstName = 42;
    (input.personalInfo as Record<string, unknown>).lastName = null;

    const result = validateAndFixResumeData(input);

    expect(result.personalInfo.firstName).toBe('42'); // numbers are stringified
    expect(result.personalInfo.lastName).toBe('');
  });

  // --- UUID regeneration ---

  it('regenerates all IDs (section IDs, entry IDs, category IDs)', () => {
    const input = makeValidAIOutput();
    const originalSectionIds = input.sections.map((s) => s.id);

    const result = validateAndFixResumeData(input);

    // All section IDs should be different from AI-generated ones
    result.sections.forEach((section, i) => {
      expect(section.id).not.toBe(originalSectionIds[i]);
      expect(section.id).toMatch(/^test-id-/);
    });

    // Entry IDs should also be regenerated
    result.sections.forEach((section) => {
      section.entries.forEach((entry) => {
        expect(entry.id).toMatch(/^test-id-/);
        expect(entry.id).not.toMatch(/^ai-/);
      });
    });

    // Skill category IDs should be regenerated
    const skillsSection = result.sections.find((s) => s.type === 'skills');
    if (skillsSection && skillsSection.entries[0]?.type === 'skills') {
      const skillsEntry = skillsSection.entries[0];
      skillsEntry.categories.forEach((cat) => {
        expect(cat.id).toMatch(/^test-id-/);
      });
    }
  });

  it('regenerates the meta.id', () => {
    const input = makeValidAIOutput();
    const result = validateAndFixResumeData(input);

    expect(result.meta.id).not.toBe('ai-generated-id');
    expect(result.meta.id).toMatch(/^test-id-/);
  });

  // --- Meta field defaults ---

  it('sets fresh createdAt and updatedAt timestamps', () => {
    const input = makeValidAIOutput();
    const result = validateAndFixResumeData(input);

    // Should be a recent ISO timestamp, not the one from AI
    expect(result.meta.createdAt).not.toBe('2024-01-01T00:00:00.000Z');
    expect(result.meta.updatedAt).not.toBe('2024-01-01T00:00:00.000Z');

    // createdAt and updatedAt should be the same (just created)
    expect(result.meta.createdAt).toBe(result.meta.updatedAt);

    // Should be valid ISO string
    expect(new Date(result.meta.createdAt).toISOString()).toBe(result.meta.createdAt);
  });

  it('sets schemaVersion to 1', () => {
    const input = makeValidAIOutput();
    const result = validateAndFixResumeData(input);

    expect(result.meta.schemaVersion).toBe(1);
  });

  it('defaults templateId to classic when not provided', () => {
    const input = makeValidAIOutput();
    delete (input.meta as Record<string, unknown>).templateId;

    const result = validateAndFixResumeData(input);

    expect(result.meta.templateId).toBe('classic');
  });

  it('preserves templateId when provided', () => {
    const input = makeValidAIOutput();
    input.meta.templateId = 'modern';

    const result = validateAndFixResumeData(input);

    expect(result.meta.templateId).toBe('modern');
  });

  it('builds meta from scratch when meta is missing', () => {
    const input = makeValidAIOutput();
    delete (input as Record<string, unknown>).meta;

    const result = validateAndFixResumeData(input);

    expect(result.meta.id).toBeTruthy();
    expect(result.meta.templateId).toBe('classic');
    expect(result.meta.schemaVersion).toBe(1);
  });

  // --- Invalid/missing required fields throw ValidationError ---

  it('throws ValidationError when data is null', () => {
    expect(() => validateAndFixResumeData(null)).toThrow(ValidationError);
  });

  it('throws ValidationError when data is not an object', () => {
    expect(() => validateAndFixResumeData('string')).toThrow(ValidationError);
    expect(() => validateAndFixResumeData(42)).toThrow(ValidationError);
  });

  it('throws ValidationError when data is an array', () => {
    expect(() => validateAndFixResumeData([])).toThrow(ValidationError);
  });

  it('throws ValidationError when personalInfo is missing', () => {
    const input = makeValidAIOutput();
    delete (input as Record<string, unknown>).personalInfo;

    expect(() => validateAndFixResumeData(input)).toThrow(ValidationError);
  });

  it('throws ValidationError when personalInfo is not an object', () => {
    const input = makeValidAIOutput();
    (input as Record<string, unknown>).personalInfo = 'not an object';

    expect(() => validateAndFixResumeData(input)).toThrow(ValidationError);
  });

  it('throws ValidationError when sections is not an array', () => {
    const input = makeValidAIOutput();
    (input as Record<string, unknown>).sections = 'not an array';

    expect(() => validateAndFixResumeData(input)).toThrow(ValidationError);
  });

  it('throws ValidationError when sections is missing', () => {
    const input = makeValidAIOutput();
    delete (input as Record<string, unknown>).sections;

    expect(() => validateAndFixResumeData(input)).toThrow(ValidationError);
  });

  // --- Date format normalization ---

  it('passes through YYYY-MM dates as-is', () => {
    const input = makeValidAIOutput();
    const result = validateAndFixResumeData(input);

    const expSection = result.sections.find((s) => s.type === 'experience');
    const entry = expSection?.entries[0];
    if (entry?.type === 'experience') {
      expect(entry.startDate).toBe('2020-03');
    }
  });

  it('normalizes YYYY-MM-DD dates to YYYY-MM', () => {
    const input = makeValidAIOutput();
    const expEntry = input.sections[1].entries[0] as Record<string, unknown>;
    expEntry.startDate = '2020-03-15';

    const result = validateAndFixResumeData(input);

    const expSection = result.sections.find((s) => s.type === 'experience');
    const entry = expSection?.entries[0];
    if (entry?.type === 'experience') {
      expect(entry.startDate).toBe('2020-03');
    }
  });

  it('normalizes bare YYYY dates to YYYY-01', () => {
    const input = makeValidAIOutput();
    const expEntry = input.sections[1].entries[0] as Record<string, unknown>;
    expEntry.startDate = '2020';

    const result = validateAndFixResumeData(input);

    const expSection = result.sections.find((s) => s.type === 'experience');
    const entry = expSection?.entries[0];
    if (entry?.type === 'experience') {
      expect(entry.startDate).toBe('2020-01');
    }
  });

  it('normalizes "Month YYYY" dates to YYYY-MM', () => {
    const input = makeValidAIOutput();
    const expEntry = input.sections[1].entries[0] as Record<string, unknown>;
    expEntry.startDate = 'January 2020';

    const result = validateAndFixResumeData(input);

    const expSection = result.sections.find((s) => s.type === 'experience');
    const entry = expSection?.entries[0];
    if (entry?.type === 'experience') {
      expect(entry.startDate).toBe('2020-01');
    }
  });

  it('normalizes abbreviated month names', () => {
    const input = makeValidAIOutput();
    const expEntry = input.sections[1].entries[0] as Record<string, unknown>;
    expEntry.startDate = 'Mar 2020';

    const result = validateAndFixResumeData(input);

    const expSection = result.sections.find((s) => s.type === 'experience');
    const entry = expSection?.entries[0];
    if (entry?.type === 'experience') {
      expect(entry.startDate).toBe('2020-03');
    }
  });

  it('normalizes MM/YYYY format', () => {
    const input = makeValidAIOutput();
    const expEntry = input.sections[1].entries[0] as Record<string, unknown>;
    expEntry.startDate = '3/2020';

    const result = validateAndFixResumeData(input);

    const expSection = result.sections.find((s) => s.type === 'experience');
    const entry = expSection?.entries[0];
    if (entry?.type === 'experience') {
      expect(entry.startDate).toBe('2020-03');
    }
  });

  it('preserves null endDate (meaning "Present")', () => {
    const input = makeValidAIOutput();

    const result = validateAndFixResumeData(input);

    const expSection = result.sections.find((s) => s.type === 'experience');
    const entry = expSection?.entries[0];
    if (entry?.type === 'experience') {
      expect(entry.endDate).toBeNull();
    }
  });

  it('handles string "null" endDate as null', () => {
    const input = makeValidAIOutput();
    const expEntry = input.sections[1].entries[0] as Record<string, unknown>;
    expEntry.endDate = 'null';

    const result = validateAndFixResumeData(input);

    const expSection = result.sections.find((s) => s.type === 'experience');
    const entry = expSection?.entries[0];
    if (entry?.type === 'experience') {
      expect(entry.endDate).toBeNull();
    }
  });

  // --- Section handling ---

  it('skips sections with invalid type', () => {
    const input = makeValidAIOutput();
    input.sections.push({
      id: 'bad-sec',
      type: 'invalid-type' as unknown as import('@/types/resume').SectionType,
      title: 'Invalid Section',
      visible: true,
      order: 5,
      entries: [],
    });

    const result = validateAndFixResumeData(input);

    // Should not include the invalid section
    expect(result.sections.find((s) => s.title === 'Invalid Section')).toBeUndefined();
  });

  it('skips sections with no valid entries', () => {
    const input = makeValidAIOutput();
    input.sections.push({
      id: 'empty-sec',
      type: 'summary',
      title: 'Empty Summary',
      visible: true,
      order: 5,
      entries: [
        { id: 'e', type: 'summary', content: '' }, // empty content = null from builder
      ],
    });

    const result = validateAndFixResumeData(input);

    expect(result.sections.find((s) => s.title === 'Empty Summary')).toBeUndefined();
  });

  it('assigns default section title when title is missing', () => {
    const input = makeValidAIOutput();
    input.sections[0].title = '';

    const result = validateAndFixResumeData(input);

    expect(result.sections[0].title).toBe('Professional Summary');
  });

  it('re-indexes section order', () => {
    const input = makeValidAIOutput();
    // Scramble orders
    input.sections[0].order = 99;
    input.sections[1].order = 50;

    const result = validateAndFixResumeData(input);

    result.sections.forEach((section, i) => {
      expect(section.order).toBe(i);
    });
  });

  // --- Entry builders ---

  it('handles skills entries with empty categories', () => {
    const input = {
      personalInfo: { firstName: 'Test', lastName: 'User', email: '', phone: '', location: '' },
      sections: [
        {
          id: 's1',
          type: 'skills',
          title: 'Skills',
          visible: true,
          order: 0,
          entries: [
            {
              id: 'e1',
              type: 'skills',
              categories: [
                { id: 'c1', name: '', skills: ['TypeScript'] }, // no name -> skip
                { id: 'c2', name: 'Languages', skills: [] },   // no skills -> skip
                { id: 'c3', name: 'Tools', skills: ['Git', 'Docker'] }, // valid
              ],
            },
          ],
        },
      ],
    };

    const result = validateAndFixResumeData(input);

    const skillsSection = result.sections.find((s) => s.type === 'skills');
    if (skillsSection?.entries[0]?.type === 'skills') {
      expect(skillsSection.entries[0].categories).toHaveLength(1);
      expect(skillsSection.entries[0].categories[0].name).toBe('Tools');
    }
  });

  it('handles experience entries with minimal data (just company)', () => {
    const input = {
      personalInfo: { firstName: 'Test', lastName: '', email: '', phone: '', location: '' },
      sections: [
        {
          id: 's1',
          type: 'experience',
          title: 'Experience',
          visible: true,
          order: 0,
          entries: [
            { id: 'e1', type: 'experience', jobTitle: '', company: 'TechCorp' },
          ],
        },
      ],
    };

    const result = validateAndFixResumeData(input);

    const expSection = result.sections.find((s) => s.type === 'experience');
    expect(expSection?.entries).toHaveLength(1);
  });

  it('skips experience entries with no jobTitle and no company', () => {
    const input = {
      personalInfo: { firstName: 'Test', lastName: '', email: '', phone: '', location: '' },
      sections: [
        {
          id: 's1',
          type: 'experience',
          title: 'Experience',
          visible: true,
          order: 0,
          entries: [
            { id: 'e1', type: 'experience', jobTitle: '', company: '' },
          ],
        },
      ],
    };

    const result = validateAndFixResumeData(input);

    // Section should be skipped entirely since all entries are invalid
    expect(result.sections.find((s) => s.type === 'experience')).toBeUndefined();
  });

  it('handles custom links in personalInfo', () => {
    const input = makeValidAIOutput();
    (input.personalInfo as Record<string, unknown>).customLinks = [
      { label: 'Portfolio', url: 'https://example.com' },
      { label: '', url: '' }, // has the right shape but empty strings — still valid shape
      42, // not an object — filtered
    ];

    const result = validateAndFixResumeData(input);

    // The custom links with valid shape should be preserved
    expect(result.personalInfo.customLinks).toBeDefined();
    expect(result.personalInfo.customLinks!.length).toBeGreaterThanOrEqual(1);
    expect(result.personalInfo.customLinks![0].label).toBe('Portfolio');
  });
});
