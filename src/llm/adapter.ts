export interface LLMResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
    };
}

export abstract class LLMProvider {
    abstract generate(prompt: string, systemPrompt?: string): Promise<LLMResponse>;

    protected async withRetry<T>(fn: () => Promise<T>, retries: number = 3, delay: number = 1000): Promise<T> {
        try {
            return await fn();
        } catch (error: any) {
            if (retries <= 0) throw error;

            const isRetryable = error.status === 429 || error.status >= 500 || error.message?.includes('fetch') || error.message?.includes('network');

            if (isRetryable) {
                console.warn(`LLM API error, retrying in ${delay}ms... (${retries} retries left)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.withRetry(fn, retries - 1, delay * 2);
            }
            throw error;
        }
    }
}

import Anthropic from '@anthropic-ai/sdk';

export class ClaudeProvider extends LLMProvider {
    private client: Anthropic;
    private model: string;

    constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20240620') {
        super();
        this.client = new Anthropic({ apiKey });
        this.model = model;
    }

    async generate(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
        return this.withRetry(async () => {
            const params: Anthropic.MessageCreateParamsNonStreaming = {
                model: this.model,
                max_tokens: 4096,
                messages: [{ role: 'user', content: prompt }],
            };

            if (systemPrompt) {
                params.system = systemPrompt;
            }

            const response = await this.client.messages.create(params);
            const firstContent = response.content[0];
            const text = firstContent && firstContent.type === 'text' ? firstContent.text : '';

            return {
                content: text,
                usage: {
                    promptTokens: response.usage.input_tokens,
                    completionTokens: response.usage.output_tokens,
                },
            };
        });
    }
}

import OpenAI from 'openai';

export class OpenAIProvider extends LLMProvider {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gpt-4o') {
        super();
        this.client = new OpenAI({ apiKey });
        this.model = model;
    }

    async generate(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
        return this.withRetry(async () => {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt || '' },
                    { role: 'user', content: prompt },
                ],
            });

            return {
                content: response.choices[0]?.message?.content || '',
                usage: {
                    promptTokens: response.usage?.prompt_tokens || 0,
                    completionTokens: response.usage?.completion_tokens || 0,
                },
            };
        });
    }
}

import { Groq } from 'groq-sdk';

export class GroqProvider extends LLMProvider {
    private client: Groq;
    private model: string;

    constructor(apiKey: string, model: string = 'llama-3.1-70b-versatile') {
        super();
        this.client = new Groq({ apiKey });
        this.model = model;
    }

    async generate(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
        return this.withRetry(async () => {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt || '' },
                    { role: 'user', content: prompt },
                ],
            });

            return {
                content: response.choices[0]?.message?.content || '',
                usage: {
                    promptTokens: response.usage?.prompt_tokens || 0,
                    completionTokens: response.usage?.completion_tokens || 0,
                },
            };
        });
    }
}

export class OllamaProvider extends LLMProvider {
    private model: string;
    private baseUrl: string;

    constructor(model: string = 'llama3', baseUrl: string = 'http://localhost:11434') {
        super();
        this.model = model;
        this.baseUrl = baseUrl;
    }

    async generate(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
        return this.withRetry(async () => {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    system: systemPrompt,
                    stream: false,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const message = (errorData as any).error || response.statusText;
                const error: any = new Error(`Ollama API error: ${message}`);
                error.status = response.status;
                throw error;
            }

            const data = await response.json() as any;
            return {
                content: data.response,
                usage: {
                    promptTokens: data.prompt_eval_count || 0,
                    completionTokens: data.eval_count || 0,
                },
            };
        });
    }
}
