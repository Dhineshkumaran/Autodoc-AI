export class LLMProvider {
}
import Anthropic from '@anthropic-ai/sdk';
export class ClaudeProvider extends LLMProvider {
    client;
    model;
    constructor(apiKey, model = 'claude-3-5-sonnet-20240620') {
        super();
        this.client = new Anthropic({ apiKey });
        this.model = model;
    }
    async generate(prompt, systemPrompt) {
        const params = {
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
    }
}
import OpenAI from 'openai';
export class OpenAIProvider extends LLMProvider {
    client;
    model;
    constructor(apiKey, model = 'gpt-4o') {
        super();
        this.client = new OpenAI({ apiKey });
        this.model = model;
    }
    async generate(prompt, systemPrompt) {
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
    }
}
import axios from 'axios';
export class OllamaProvider extends LLMProvider {
    baseUrl;
    model;
    constructor(model = 'llama3', baseUrl = 'http://localhost:11434') {
        super();
        this.baseUrl = baseUrl;
        this.model = model;
    }
    async generate(prompt, systemPrompt) {
        const response = await axios.post(`${this.baseUrl}/api/generate`, {
            model: this.model,
            prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
            stream: false,
        });
        return {
            content: response.data.response,
        };
    }
}
//# sourceMappingURL=adapter.js.map