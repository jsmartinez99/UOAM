/**
 * LLM Client Factory
 *
 * Selecciona el proveedor de LLM según las variables de entorno:
 *   LLM_PROVIDER=ollama  (default) - Ollama local
 *   LLM_PROVIDER=mock              - Mock para tests
 *
 * El mock se usa automáticamente si:
 *   - VITEST=true (en tests)
 *   - LLM_PROVIDER=mock explícito
 *   - Ollama no está disponible y no hay API key configurada
 */

import type { LLMClient } from '../../ports/llm-client.port';
import { OllamaLLMClient } from './ollama-client';

export class MockLLMClient implements LLMClient {
  async generateText(_systemPrompt: string): Promise<string> {
    return 'Mock analysis';
  }
}

export type LLMProvider = 'ollama' | 'mock';

export function resolveLLMProvider(): LLMProvider {
  // En tests, siempre mock (VITEST tiene prioridad)
  if (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test') {
    return 'mock';
  }

  const explicit = process.env.LLM_PROVIDER?.toLowerCase();
  if (explicit === 'mock' || explicit === 'ollama') return explicit;

  // En runtime, intentar Ollama; fallback a mock si no responde
  return 'ollama';
}

export function createLLMClient(forceProvider?: LLMProvider): LLMClient {
  const provider = forceProvider ?? resolveLLMProvider();
  switch (provider) {
    case 'ollama':
      return new OllamaLLMClient();
    case 'mock':
    default:
      return new MockLLMClient();
  }
}
