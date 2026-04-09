import { migrateAIConfig } from '@/lib/ai';

describe('migrateAIConfig', () => {
  it('returns null for null/undefined input', () => {
    expect(migrateAIConfig(null)).toBeNull();
    expect(migrateAIConfig(undefined)).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(migrateAIConfig('string')).toBeNull();
    expect(migrateAIConfig(42)).toBeNull();
  });

  it('passes through new format unchanged', () => {
    const newFormat = {
      activeProvider: 'openai',
      providers: {
        openai: { apiKey: 'sk-123', model: 'gpt-5-mini' },
      },
    };
    expect(migrateAIConfig(newFormat)).toEqual(newFormat);
  });

  it('migrates legacy format to new format', () => {
    const legacy = { apiKey: 'sk-old-key', model: 'gpt-4o' };
    const result = migrateAIConfig(legacy);

    expect(result).toEqual({
      activeProvider: 'openai',
      providers: {
        openai: { apiKey: 'sk-old-key', model: 'gpt-4o' },
      },
    });
  });

  it('migrates legacy format without model using default', () => {
    const legacy = { apiKey: 'sk-old-key' };
    const result = migrateAIConfig(legacy);

    expect(result).toEqual({
      activeProvider: 'openai',
      providers: {
        openai: { apiKey: 'sk-old-key', model: 'gpt-5-mini' },
      },
    });
  });

  it('returns null for legacy format with empty apiKey', () => {
    expect(migrateAIConfig({ apiKey: '' })).toBeNull();
  });

  it('returns null for object without apiKey or activeProvider', () => {
    expect(migrateAIConfig({ foo: 'bar' })).toBeNull();
  });
});
