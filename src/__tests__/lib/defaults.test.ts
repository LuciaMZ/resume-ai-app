import { createDefaultResumeData } from '@/lib/defaults';

// ---------------------------------------------------------------------------
// createDefaultResumeData
// ---------------------------------------------------------------------------

describe('createDefaultResumeData', () => {
  // --- Top-level structure ---
  it('returns an object with meta, personalInfo, and sections', () => {
    const data = createDefaultResumeData();
    expect(data).toHaveProperty('meta');
    expect(data).toHaveProperty('personalInfo');
    expect(data).toHaveProperty('sections');
  });

  // --- Meta ---
  describe('meta', () => {
    it('has a UUID id', () => {
      const data = createDefaultResumeData();
      expect(data.meta.id).toBeTruthy();
      expect(typeof data.meta.id).toBe('string');
      // UUID v4 format: 8-4-4-4-12 hex chars
      expect(data.meta.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('has templateId "classic"', () => {
      const data = createDefaultResumeData();
      expect(data.meta.templateId).toBe('classic');
    });

    it('has schemaVersion 1', () => {
      const data = createDefaultResumeData();
      expect(data.meta.schemaVersion).toBe(1);
    });

    it('has valid ISO 8601 createdAt and updatedAt', () => {
      const data = createDefaultResumeData();
      // ISO string parsing should not produce NaN
      expect(new Date(data.meta.createdAt).getTime()).not.toBeNaN();
      expect(new Date(data.meta.updatedAt).getTime()).not.toBeNaN();
    });

    it('has createdAt equal to updatedAt on fresh creation', () => {
      const data = createDefaultResumeData();
      expect(data.meta.createdAt).toBe(data.meta.updatedAt);
    });
  });

  // --- PersonalInfo ---
  describe('personalInfo', () => {
    it('has all required fields as empty strings', () => {
      const { personalInfo } = createDefaultResumeData();
      expect(personalInfo.firstName).toBe('');
      expect(personalInfo.lastName).toBe('');
      expect(personalInfo.email).toBe('');
      expect(personalInfo.phone).toBe('');
      expect(personalInfo.location).toBe('');
    });

    it('has optional string fields', () => {
      const { personalInfo } = createDefaultResumeData();
      // These exist on the object (may be empty strings)
      expect(typeof personalInfo.website).toBe('string');
      expect(typeof personalInfo.linkedIn).toBe('string');
      expect(typeof personalInfo.github).toBe('string');
    });
  });

  // --- Sections ---
  describe('sections', () => {
    it('has exactly 4 sections', () => {
      const data = createDefaultResumeData();
      expect(data.sections).toHaveLength(4);
    });

    it('has sections with types: summary, experience, education, skills', () => {
      const data = createDefaultResumeData();
      const types = data.sections.map((s) => s.type);
      expect(types).toEqual(['summary', 'experience', 'education', 'skills']);
    });

    it('has correct order values 0, 1, 2, 3', () => {
      const data = createDefaultResumeData();
      const orders = data.sections.map((s) => s.order);
      expect(orders).toEqual([0, 1, 2, 3]);
    });

    it('has all sections visible', () => {
      const data = createDefaultResumeData();
      for (const section of data.sections) {
        expect(section.visible).toBe(true);
      }
    });

    it('every section has an id, type, title, and entries', () => {
      const data = createDefaultResumeData();
      for (const section of data.sections) {
        expect(section.id).toBeTruthy();
        expect(typeof section.type).toBe('string');
        expect(typeof section.title).toBe('string');
        expect(section.title.length).toBeGreaterThan(0);
        expect(Array.isArray(section.entries)).toBe(true);
      }
    });

    it('every section has at least one entry', () => {
      const data = createDefaultResumeData();
      for (const section of data.sections) {
        expect(section.entries.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('experience entry has placeholder content fields', () => {
      const data = createDefaultResumeData();
      const expSection = data.sections.find((s) => s.type === 'experience')!;
      const entry = expSection.entries[0];
      // Discriminated union: we check the experience-specific fields
      expect(entry.type).toBe('experience');
      if (entry.type === 'experience') {
        expect(entry.jobTitle).toBeTruthy();
        expect(entry.company).toBeTruthy();
        expect(entry.location).toBeTruthy();
        expect(entry.startDate).toBeTruthy();
        // endDate can be null (meaning "Present")
        expect('endDate' in entry).toBe(true);
        expect(entry.description).toBeTruthy();
      }
    });

    it('skills entry has categories with items', () => {
      const data = createDefaultResumeData();
      const skillsSection = data.sections.find((s) => s.type === 'skills')!;
      const entry = skillsSection.entries[0];
      expect(entry.type).toBe('skills');
      if (entry.type === 'skills') {
        expect(Array.isArray(entry.categories)).toBe(true);
        expect(entry.categories.length).toBeGreaterThan(0);
        for (const cat of entry.categories) {
          expect(cat.id).toBeTruthy();
          expect(cat.name).toBeTruthy();
          expect(cat.skills.length).toBeGreaterThan(0);
        }
      }
    });
  });

  // --- Fresh UUIDs ---
  it('generates fresh UUIDs on each call', () => {
    const data1 = createDefaultResumeData();
    const data2 = createDefaultResumeData();
    expect(data1.meta.id).not.toBe(data2.meta.id);
    // Section IDs should also differ
    expect(data1.sections[0].id).not.toBe(data2.sections[0].id);
  });
});
