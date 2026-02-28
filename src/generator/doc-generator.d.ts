import { LLMProvider } from '../llm/adapter.js';
import type { FileInfo } from '../crawler/crawler.js';
export declare class DocGenerator {
    private provider;
    private outputDir;
    constructor(provider: LLMProvider, outputDir: string);
    generateReadme(files: FileInfo[]): Promise<string>;
    generateFileDocs(files: FileInfo[]): Promise<void>;
}
//# sourceMappingURL=doc-generator.d.ts.map