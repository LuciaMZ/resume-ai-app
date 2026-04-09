import type { AIProviderDefinition } from '@/types/ai';

const registry: Record<string, AIProviderDefinition> = {};

export function registerProvider(provider: AIProviderDefinition): void {
  registry[provider.id] = provider;
}

export function getProvider(id: string): AIProviderDefinition | undefined {
  return registry[id];
}

export function getAllProviders(): AIProviderDefinition[] {
  return Object.values(registry);
}
