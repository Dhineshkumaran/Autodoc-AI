import { Command } from 'commander';
import { Crawler } from './crawler/crawler.js';
import { ClaudeProvider, OpenAIProvider, OllamaProvider, LLMProvider } from './llm/adapter.js';
import { DocGenerator } from './generator/doc-generator.js';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();
const program = new Command();
program
    .name('autodoc-ai')
    .description('AI-Powered Project Documentation Generator')
    .version('1.0.0');
program
    .command('generate')
    .description('Generate documentation for the project')
    .option('-p, --provider <provider>', 'LLM provider (claude, openai, ollama)', 'claude')
    .option('-m, --model <model>', 'LLM model name')
    .option('-o, --output <dir>', 'Output directory', './docs')
    .option('-i, --include <patterns...>', 'Patterns to include', ['**/*'])
    .option('-e, --exclude <patterns...>', 'Patterns to exclude', [])
    .action(async (options) => {
    console.log('🚀 Starting documentation generation...');
    let provider;
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
    switch (options.provider) {
        case 'claude':
            provider = new ClaudeProvider(process.env.ANTHROPIC_API_KEY || '', options.model);
            break;
        case 'openai':
            provider = new OpenAIProvider(process.env.OPENAI_API_KEY || '', options.model);
            break;
        case 'ollama':
            provider = new OllamaProvider(options.model);
            break;
        default:
            console.error('❌ Invalid provider');
            process.exit(1);
    }
    const crawler = new Crawler(process.cwd());
    const files = await crawler.crawl(options.include, options.exclude);
    console.log(`📂 Crawled ${files.length} files.`);
    const generator = new DocGenerator(provider, path.resolve(process.cwd(), options.output));
    console.log('📝 Generating README.md...');
    await generator.generateReadme(files);
    // Uncomment to generate per-file docs (might be expensive)
    // console.log('📝 Generating file-level documentation...');
    // await generator.generateFileDocs(files);
    console.log(`✅ Documentation generated in ${options.output}`);
});
program.parse(process.argv);
//# sourceMappingURL=index.js.map