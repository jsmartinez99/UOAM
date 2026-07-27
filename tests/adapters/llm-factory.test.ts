import { describe, it, expect } from 'vitest';
import { MockLLMClient, createLLMClient, resolveLLMProvider } from '../../src/adapters/llm/llm-factory';

describe('LLM Factory', () => {
  it('MockLLMClient debe devolver "Mock analysis"', async () => {
    const client = new MockLLMClient();
    expect(await client.generateText('any prompt')).toBe('Mock analysis');
  });

  it('createLLMClient("mock") debe devolver MockLLMClient', () => {
    const client = createLLMClient('mock');
    expect(client).toBeInstanceOf(MockLLMClient);
  });

  it('createLLMClient("ollama") debe devolver OllamaLLMClient', () => {
    const client = createLLMClient('ollama');
    expect(client.constructor.name).toBe('OllamaLLMClient');
  });

  it('debe usar mock cuando VITEST=true', () => {
    const original = process.env.VITEST;
    process.env.VITEST = 'true';
    process.env.LLM_PROVIDER = 'ollama';
    expect(resolveLLMProvider()).toBe('mock');
    if (original) process.env.VITEST = original;
    else delete process.env.VITEST;
  });

  it('debe respetar LLM_PROVIDER=mock explícito', () => {
    const originalV = process.env.VITEST;
    const originalL = process.env.LLM_PROVIDER;
    const originalN = process.env.NODE_ENV;
    delete process.env.VITEST;
    process.env.NODE_ENV = 'production';
    process.env.LLM_PROVIDER = 'mock';
    expect(resolveLLMProvider()).toBe('mock');
    process.env.LLM_PROVIDER = originalL;
    if (originalV) process.env.VITEST = originalV;
    if (originalN) process.env.NODE_ENV = originalN;
  });

  it('debe respetar LLM_PROVIDER=ollama explícito', () => {
    const originalV = process.env.VITEST;
    const originalL = process.env.LLM_PROVIDER;
    const originalN = process.env.NODE_ENV;
    delete process.env.VITEST;
    process.env.NODE_ENV = 'production';
    process.env.LLM_PROVIDER = 'ollama';
    expect(resolveLLMProvider()).toBe('ollama');
    process.env.LLM_PROVIDER = originalL;
    if (originalV) process.env.VITEST = originalV;
    if (originalN) process.env.NODE_ENV = originalN;
  });

  it('debe hacer fallback a "ollama" en producción sin LLM_PROVIDER explícito', () => {
    const originalV = process.env.VITEST;
    const originalL = process.env.LLM_PROVIDER;
    const originalN = process.env.NODE_ENV;
    delete process.env.VITEST;
    delete process.env.LLM_PROVIDER;
    process.env.NODE_ENV = 'production';
    expect(resolveLLMProvider()).toBe('ollama');
    process.env.LLM_PROVIDER = originalL;
    if (originalV) process.env.VITEST = originalV;
    if (originalN) process.env.NODE_ENV = originalN;
  });
});
