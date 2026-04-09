'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Eye, EyeOff, CheckCircle, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { useAIConfig } from '@/hooks/useAIConfig';
import { useToast } from '@/hooks/useToast';
import { getAllProviders, fetchProviderModels } from '@/lib/ai';
import type { AIModel } from '@/types/ai';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AISettingsModal({ isOpen, onClose }: AISettingsModalProps) {
  const { aiConfig, isAIEnabled, setProviderConfig, clearProviderConfig } = useAIConfig();
  const { addToast } = useToast();

  const providers = useMemo(() => getAllProviders(), []);
  const defaultProviderId = providers[0]?.id ?? 'openai';

  const [selectedProviderId, setSelectedProviderId] = useState(defaultProviderId);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [models, setModels] = useState<AIModel[]>([]);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);

  // Sync form state when modal opens or provider changes
  const syncFormState = useCallback(
    (providerId: string) => {
      const providerDef = providers.find((p) => p.id === providerId);
      const providerCfg = aiConfig?.providers[providerId];

      setApiKey(providerCfg?.apiKey ?? '');
      setModel(providerCfg?.model ?? providerDef?.defaultModel ?? '');
      setModels(providerCfg?.cachedModels ?? []);
      setShowKey(false);
      setSaved(false);
    },
    [aiConfig, providers]
  );

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      triggerRef.current = document.activeElement as HTMLElement;
      const activeId = aiConfig?.activeProvider ?? defaultProviderId;
      setSelectedProviderId(activeId);
      syncFormState(activeId);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, aiConfig, defaultProviderId, syncFormState]);

  // Return focus on close
  useEffect(() => {
    if (!isOpen && triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const dialog = dialogRef.current;

    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const focusableElements = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstEl = focusableElements[0];
      const lastEl = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    }

    dialog.addEventListener('keydown', handleTab);
    return () => dialog.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  function handleProviderChange(providerId: string) {
    setSelectedProviderId(providerId);
    syncFormState(providerId);
  }

  async function handleFetchModels() {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey || !selectedProviderId) return;

    setIsFetchingModels(true);
    try {
      const fetched = await fetchProviderModels(selectedProviderId, trimmedKey);
      setModels(fetched);
      if (fetched.length > 0 && !fetched.find((m) => m.id === model)) {
        setModel(fetched[0].id);
      }
      addToast(`Loaded ${fetched.length} models`, 'success');
    } catch {
      addToast('Failed to fetch models. Check your API key.', 'error');
    } finally {
      setIsFetchingModels(false);
    }
  }

  function handleSave() {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) return;

    setProviderConfig(selectedProviderId, {
      apiKey: trimmedKey,
      model,
      cachedModels: models.length > 0 ? models : undefined,
    });
    setSaved(true);
    addToast('Settings saved', 'success');

    // Fetch models in the background on first save if no cached models
    if (models.length === 0) {
      fetchProviderModels(selectedProviderId, trimmedKey)
        .then((fetched) => {
          if (fetched.length > 0) {
            setProviderConfig(selectedProviderId, {
              apiKey: trimmedKey,
              model,
              cachedModels: fetched,
            });
          }
        })
        .catch(() => {
          // Silent fail for background fetch
        });
    }

    setTimeout(() => onClose(), 600);
  }

  function handleRemove() {
    clearProviderConfig(selectedProviderId);
    setApiKey('');
    setModel(selectedProvider?.defaultModel ?? '');
    setModels([]);
    setSaved(false);
    addToast('API key removed', 'info');
    onClose();
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  const canSave = apiKey.trim().length > 0;
  const hasKeyForProvider = !!aiConfig?.providers[selectedProviderId]?.apiKey;
  const isActiveProvider = aiConfig?.activeProvider === selectedProviderId;

  // Build model options: cached models or just the default
  const modelOptions =
    models.length > 0
      ? models
      : selectedProvider
        ? [{ id: selectedProvider.defaultModel, name: selectedProvider.defaultModel }]
        : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="AI Settings"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" />

      {/* Modal */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-surface-900">
              AI Settings
            </h2>
            <p className="mt-0.5 text-sm text-surface-500">
              Configure your AI provider for suggestions
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Status indicator */}
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
              isAIEnabled
                ? 'bg-green-50 text-green-700 border border-green-100'
                : 'bg-surface-50 text-surface-600 border border-surface-100'
            }`}
          >
            {isAIEnabled ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                AI suggestions enabled
                {aiConfig && (
                  <span className="ml-auto text-xs text-green-600">
                    {providers.find((p) => p.id === aiConfig.activeProvider)?.name}
                  </span>
                )}
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-surface-400" />
                No API key configured
              </>
            )}
          </div>

          {/* Provider Selector */}
          <div>
            <label
              htmlFor="ai-provider"
              className="mb-1.5 block text-sm font-medium text-surface-700"
            >
              Provider
            </label>
            <select
              id="ai-provider"
              value={selectedProviderId}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 transition-all duration-150 hover:border-surface-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* API Key Input */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="api-key"
                className="block text-sm font-medium text-surface-700"
              >
                API Key
              </label>
              {selectedProvider && (
                <a
                  href={selectedProvider.apiKeyHelpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                >
                  Get API key
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="relative">
              <input
                ref={inputRef}
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setSaved(false);
                }}
                placeholder={selectedProvider?.apiKeyPlaceholder ?? ''}
                className="w-full rounded-lg border border-surface-200 bg-white py-2.5 pl-3 pr-10 text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-150 hover:border-surface-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:shadow-sm"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-surface-400 transition-colors hover:text-surface-600"
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-surface-400">
              Your key is stored locally in your browser. It is only used for
              direct API calls to {selectedProvider?.name ?? 'the AI provider'}.
            </p>
          </div>

          {/* Model Selector */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="model"
                className="block text-sm font-medium text-surface-700"
              >
                Model
              </label>
              <button
                type="button"
                onClick={handleFetchModels}
                disabled={!apiKey.trim() || isFetchingModels}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 disabled:text-surface-400 disabled:cursor-not-allowed"
                aria-label="Refresh model list"
              >
                <RefreshCw
                  className={`h-3 w-3 ${isFetchingModels ? 'animate-spin' : ''}`}
                />
                {isFetchingModels ? 'Loading...' : 'Refresh models'}
              </button>
            </div>
            <select
              id="model"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setSaved(false);
              }}
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 transition-all duration-150 hover:border-surface-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              {modelOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-surface-100 px-6 py-4">
          {hasKeyForProvider ? (
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Remove Key
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || saved}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-all duration-150 ${
                saved
                  ? 'bg-green-600 text-white'
                  : canSave
                    ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md active:bg-primary-800'
                    : 'cursor-not-allowed bg-surface-100 text-surface-400'
              }`}
            >
              {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
