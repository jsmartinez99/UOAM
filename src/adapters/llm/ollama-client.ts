/**
 * LLMClient adapter: Ollama (local)
 *
 * Implementa LLMClient usando la API HTTP de Ollama.
 * Compatible con cualquier modelo servido por Ollama (qwen2.5, llama3, etc.).
 *
 * Configuración por environment variables:
 *   OLLAMA_URL       - URL base de Ollama (default: http://localhost:11434)
 *   OLLAMA_MODEL     - Modelo a usar (default: qwen2.5:3b)
 *   LLM_TIMEOUT_MS   - Timeout en ms (default: 60000)
 */

import { LLMClient } from '../../ports/llm-client.port';

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

export function loadOllamaConfig(overrides: Partial<OllamaConfig> = {}): OllamaConfig {
  return {
    baseUrl: overrides.baseUrl ?? process.env.OLLAMA_URL ?? 'http://localhost:11434',
    model: overrides.model ?? process.env.OLLAMA_MODEL ?? 'qwen2.5:3b',
    timeoutMs: overrides.timeoutMs ?? Number.parseInt(process.env.LLM_TIMEOUT_MS ?? '60000', 10),
  };
}

export class OllamaLLMClient implements LLMClient {
  constructor(private readonly config: OllamaConfig = loadOllamaConfig()) {}

  async generateText(systemPrompt: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          prompt: systemPrompt,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama HTTP ${response.status}: ${await response.text()}`);
      }

      const data = (await response.json()) as { response?: string; error?: string };
      if (data.error) {
        throw new Error(`Ollama error: ${data.error}`);
      }
      if (!data.response) {
        throw new Error('Ollama returned empty response');
      }
      return data.response;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Verifica que Ollama esté disponible y el modelo exista.
   * Útil como health check al arrancar el servidor.
   */
  async healthCheck(): Promise<{ ok: boolean; model: string; error?: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        return { ok: false, model: this.config.model, error: `HTTP ${response.status}` };
      }
      const data = (await response.json()) as { models?: Array<{ name: string }> };
      const hasModel = (data.models ?? []).some((m) => m.name.startsWith(this.config.model));
      if (!hasModel) {
        return {
          ok: false,
          model: this.config.model,
          error: `Model not found. Run: ollama pull ${this.config.model}`,
        };
      }
      return { ok: true, model: this.config.model };
    } catch (e) {
      return { ok: false, model: this.config.model, error: (e as Error).message };
    }
  }
}
