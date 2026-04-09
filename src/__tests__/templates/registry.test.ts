import { templateRegistry, getTemplate, getAllTemplates } from '@/components/templates/registry';

// ---------------------------------------------------------------------------
// Template Registry
// ---------------------------------------------------------------------------

describe('templateRegistry', () => {
  it('has a "classic" template registered', () => {
    expect(templateRegistry).toHaveProperty('classic');
  });

  it('classic template has the correct id', () => {
    expect(templateRegistry.classic.id).toBe('classic');
  });

  it('classic template has the correct name', () => {
    expect(templateRegistry.classic.name).toBe('Classic');
  });

  it('classic template has a non-empty description', () => {
    expect(typeof templateRegistry.classic.description).toBe('string');
    expect(templateRegistry.classic.description.length).toBeGreaterThan(0);
  });

  it('classic template has a thumbnail path', () => {
    expect(typeof templateRegistry.classic.thumbnail).toBe('string');
    expect(templateRegistry.classic.thumbnail.length).toBeGreaterThan(0);
  });

  it('classic template has a component', () => {
    expect(templateRegistry.classic.component).toBeDefined();
    expect(typeof templateRegistry.classic.component).toBe('function');
  });

  it('has a "compact" template registered', () => {
    expect(templateRegistry).toHaveProperty('compact');
  });

  it('compact template has the correct id', () => {
    expect(templateRegistry.compact.id).toBe('compact');
  });

  it('compact template has the correct name', () => {
    expect(templateRegistry.compact.name).toBe('Compact');
  });

  it('compact template has a non-empty description', () => {
    expect(typeof templateRegistry.compact.description).toBe('string');
    expect(templateRegistry.compact.description.length).toBeGreaterThan(0);
  });

  it('compact template has a thumbnail path', () => {
    expect(typeof templateRegistry.compact.thumbnail).toBe('string');
    expect(templateRegistry.compact.thumbnail.length).toBeGreaterThan(0);
  });

  it('compact template has a component', () => {
    expect(templateRegistry.compact.component).toBeDefined();
    expect(typeof templateRegistry.compact.component).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// getTemplate
// ---------------------------------------------------------------------------

describe('getTemplate', () => {
  it('returns the classic template definition when given "classic"', () => {
    const tpl = getTemplate('classic');
    expect(tpl).toBeDefined();
    expect(tpl!.id).toBe('classic');
    expect(tpl!.name).toBe('Classic');
    expect(tpl!.component).toBeDefined();
  });

  it('returns the compact template definition when given "compact"', () => {
    const tpl = getTemplate('compact');
    expect(tpl).toBeDefined();
    expect(tpl!.id).toBe('compact');
    expect(tpl!.name).toBe('Compact');
    expect(tpl!.component).toBeDefined();
  });

  it('returns undefined for a nonexistent template', () => {
    const tpl = getTemplate('nonexistent');
    expect(tpl).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    const tpl = getTemplate('');
    expect(tpl).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getAllTemplates
// ---------------------------------------------------------------------------

describe('getAllTemplates', () => {
  it('returns an array', () => {
    const templates = getAllTemplates();
    expect(Array.isArray(templates)).toBe(true);
  });

  it('returns at least 1 template', () => {
    const templates = getAllTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(1);
  });

  it('all templates have required fields', () => {
    const templates = getAllTemplates();
    for (const tpl of templates) {
      expect(typeof tpl.id).toBe('string');
      expect(tpl.id.length).toBeGreaterThan(0);

      expect(typeof tpl.name).toBe('string');
      expect(tpl.name.length).toBeGreaterThan(0);

      expect(typeof tpl.description).toBe('string');
      expect(tpl.description.length).toBeGreaterThan(0);

      expect(typeof tpl.thumbnail).toBe('string');
      expect(tpl.thumbnail.length).toBeGreaterThan(0);

      expect(tpl.component).toBeDefined();
      expect(typeof tpl.component).toBe('function');
    }
  });

  it('includes the classic template', () => {
    const templates = getAllTemplates();
    const classic = templates.find((t) => t.id === 'classic');
    expect(classic).toBeDefined();
    expect(classic!.name).toBe('Classic');
  });

  it('includes the compact template', () => {
    const templates = getAllTemplates();
    const compact = templates.find((t) => t.id === 'compact');
    expect(compact).toBeDefined();
    expect(compact!.name).toBe('Compact');
  });

  it('includes exactly 4 templates (classic, modern, academic, compact)', () => {
    const templates = getAllTemplates();
    expect(templates.length).toBe(4);
    const ids = templates.map((t) => t.id).sort();
    expect(ids).toEqual(['academic', 'classic', 'compact', 'modern']);
  });
});
