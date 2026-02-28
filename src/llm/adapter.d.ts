export interface LLMResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
    };
}
export declare abstract class LLMProvider {
    abstract generate(prompt: string, systemPrompt?: string): Promise<LLMResponse>;
}
export declare class ClaudeProvider extends LLMProvider {
    private client;
    private model;
    constructor(apiKey: string, model?: string);
    generate(prompt: string, systemPrompt?: string): Promise<LLMResponse>;
}
export declare class OpenAIProvider extends LLMProvider {
    private client;
    private model;
    constructor(apiKey: string, model?: string);
    generate(prompt: string, systemPrompt?: string): Promise<LLMResponse>;
}
export declare class OllamaProvider extends LLMProvider {
    private baseUrl;
    private model;
    constructor(model?: string, baseUrl?: string);
    generate(prompt: string, systemPrompt?: string): Promise<LLMResponse>;
}
//# sourceMappingURL=adapter.d.ts.map