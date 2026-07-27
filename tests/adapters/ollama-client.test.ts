import { describe, it, expect, vi, afterEach } from 'vitest';
import { OllamaLLMClient, loadOllamaConfig } from '../../src/adapters/llm/ollama-client';

describe('OllamaLLMClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('loadOllamaConfig', () => {
    it('debe usar defaults cuando no hay env vars', () => {
      const originalEnv = { ...process.env };
      delete process.env.OLLAMA_URL;
      delete process.env.OLLAMA_MODEL;
      delete process.env.LLM_TIMEOUT_MS;
      const config = loadOllamaConfig();
      expect(config.baseUrl).toBe('http://localhost:11434');
      expect(config.model).toBe('qwen2.5:3b');
      expect(config.timeoutMs).toBe(60000);
      process.env = originalEnv;
    });

    it('debe leer env vars', () => {
      const originalEnv = { ...process.env };
      process.env.OLLAMA_URL = 'http://custom:1234';
      process.env.OLLAMA_MODEL = 'llama3.2:3b';
      process.env.LLM_TIMEOUT_MS = '30000';
      const config = loadOllamaConfig();
      expect(config.baseUrl).toBe('http://custom:1234');
      expect(config.model).toBe('llama3.2:3b');
      expect(config.timeoutMs).toBe(30000);
      process.env = originalEnv;
    });

    it('debe permitir overrides explícitos', () => {
      const config = loadOllamaConfig({ baseUrl: 'http://override:9999' });
      expect(config.baseUrl).toBe('http://override:9999');
    });
  });

  describe('generateText', () => {
    it('debe llamar a Ollama y devolver la respuesta', async () => {
      const mockResponse = { response: 'Texto generado por el LLM' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const client = new OllamaLLMClient({ baseUrl: 'http://test:11434', model: 'test-model', timeoutMs: 5000 });
      const result = await client.generateText('system prompt');

      expect(result).toBe('Texto generado por el LLM');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test:11434/api/generate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ model: 'test-model', prompt: 'system prompt', stream: false }),
        }),
      );
    });

    it('debe lanzar error cuando Ollama responde con error HTTP', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const client = new OllamaLLMClient({ baseUrl: 'http://test', model: 'm', timeoutMs: 1000 });
      await expect(client.generateText('p')).rejects.toThrow('Ollama HTTP 500');
    });

    it('debe lanzar error cuando Ollama devuelve error en JSON', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ error: 'model not found' }),
      });

      const client = new OllamaLLMClient({ baseUrl: 'http://test', model: 'm', timeoutMs: 1000 });
      await expect(client.generateText('p')).rejects.toThrow('Ollama error: model not found');
    });

    it('debe lanzar error cuando la respuesta está vacía', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const client = new OllamaLLMClient({ baseUrl: 'http://test', model: 'm', timeoutMs: 1000 });
      await expect(client.generateText('p')).rejects.toThrow('empty response');
    });

    it('debe abortar por timeout', async () => {
      global.fetch = vi.fn().mockImplementation((_url, opts) => {
        return new Promise((_resolve, reject) => {
          opts?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        });
      });

      const client = new OllamaLLMClient({ baseUrl: 'http://test', model: 'm', timeoutMs: 50 });
      await expect(client.generateText('p')).rejects.toThrow('aborted');
    });
  });

  describe('healthCheck', () => {
    it('debe retornar ok=true cuando Ollama responde y el modelo existe', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ models: [{ name: 'qwen2.5:3b' }, { name: 'llama3.2:3b' }] }),
      });

      const client = new OllamaLLMClient({ baseUrl: 'http://test', model: 'qwen2.5:3b', timeoutMs: 5000 });
      const result = await client.healthCheck();
      expect(result.ok).toBe(true);
      expect(result.model).toBe('qwen2.5:3b');
    });

    it('debe retornar ok=false cuando el modelo no está descargado', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ models: [{ name: 'llama3.2:3b' }] }),
      });

      const client = new OllamaLLMClient({ baseUrl: 'http://test', model: 'missing-model', timeoutMs: 5000 });
      const result = await client.healthCheck();
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Model not found');
      expect(result.error).toContain('ollama pull');
    });

    it('debe retornar ok=false cuando Ollama no responde', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      });

      const client = new OllamaLLMClient({ baseUrl: 'http://test', model: 'm', timeoutMs: 1000 });
      const result = await client.healthCheck();
      expect(result.ok).toBe(false);
      expect(result.error).toContain('503');
    });

    it('debe retornar ok=false cuando la conexión falla', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const client = new OllamaLLMClient({ baseUrl: 'http://test', model: 'm', timeoutMs: 1000 });
      const result = await client.healthCheck();
      expect(result.ok).toBe(false);
      expect(result.error).toBe('ECONNREFUSED');
    });
  });
});
