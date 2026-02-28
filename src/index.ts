#!/usr/bin/env node
import { Command } from 'commander';
import { Crawler } from './crawler/crawler.js';
import { ClaudeProvider, OpenAIProvider, OllamaProvider, GroqProvider, LLMProvider } from './llm/adapter.js';
import { DocGenerator } from './generator/doc-generator.js';
import { ConfigLoader } from './config/config-loader.js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { select, input, confirm } from '@inquirer/prompts';

dotenv.config();

const program = new Command();
const configLoader = new ConfigLoader();

program
    .name('autodoc-ai')
    .description('AI-Powered Project Documentation Generator')
    .version('1.1.1');

program
    .command('init')
    .description('Initialize a new .autodocrc.json configuration file')
    .action(async () => {
        console.log('--- Autodoc-AI Initialization ---');

        const providerModels: Record<string, string[]> = {
            'claude': ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
            'openai': ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
            'groq': [
                'openai/gpt-oss-120b',
                'deepseek-r1-distill-llama-70b',
                'llama-3.3-70b-versatile',
                'llama-3.1-8b-instant',
                'mixtral-8x7b-32768'
            ],
            'ollama': ['llama3', 'mistral', 'phi3', 'gemma']
        };

        // Step 1: Select Provider
        const provider = await select({
            message: 'Select an LLM provider (Use arrow keys):',
            choices: [
                { name: '1) Claude (Recommended)', value: 'claude' },
                { name: '2) OpenAI', value: 'openai' },
                { name: '3) Groq (Fast)', value: 'groq' },
                { name: '4) Ollama (Local)', value: 'ollama' }
            ],
            pageSize: 10
        });

        // Step 2: Select Model based on Provider
        const models = providerModels[provider] || [];
        const modelSelection = await select({
            message: `Select a model for ${provider}:`,
            choices: [
                ...models.map((m, i) => ({ name: `${i + 1}) ${m}`, value: m })),
                { name: 'Other...', value: 'other' }
            ],
            pageSize: 10
        });

        let model = modelSelection;
        if (modelSelection === 'other') {
            model = await input({
                message: 'Enter the custom model name:',
                validate: (val: string) => val.length > 0 || 'Model name cannot be empty'
            });
        }

        // Step 3: Output Directory
        const output = await input({
            message: 'Enter the output directory for documentation:',
            default: './docs'
        });

        const finalConfig = { provider, model, output };
        const configPath = path.join(process.cwd(), '.autodocrc.json');

        if (fs.existsSync(configPath)) {
            const overwrite = await confirm({
                message: '.autodocrc.json already exists. Overwrite?',
                default: false
            });
            if (!overwrite) {
                console.log('Action cancelled.');
                return;
            }
        }

        fs.writeFileSync(configPath, JSON.stringify(finalConfig, null, 4));
        console.log(`Configuration saved to ${configPath}`);
        console.log('You can now run "autodoc-ai generate" to start creating documentation.');
    });

program
    .command('generate')
    .description('Generate documentation for the project')
    .option('-p, --provider <provider>', 'LLM provider (claude, openai, ollama, groq)')
    .option('-m, --model <model>', 'LLM model name')
    .option('-o, --output <dir>', 'Output directory')
    .option('-i, --include <patterns...>', 'Patterns to include')
    .option('-e, --exclude <patterns...>', 'Patterns to exclude')
    .action(async (options) => {
        const fileConfig = configLoader.loadConfig(process.cwd());
        const config = configLoader.mergeConfig(options, fileConfig);

        console.log('Starting documentation generation...');
        console.log(`Using provider: ${config.provider}${config.model ? ` (model: ${config.model})` : ''}`);

        let provider: LLMProvider;

        switch (config.provider) {
            case 'claude':
                provider = new ClaudeProvider(process.env.ANTHROPIC_API_KEY || '', config.model);
                break;
            case 'openai':
                provider = new OpenAIProvider(process.env.OPENAI_API_KEY || '', config.model);
                break;
            case 'groq':
                provider = new GroqProvider(process.env.GROQ_API_KEY || '', config.model);
                break;
            case 'ollama':
                provider = new OllamaProvider(config.model);
                break;
            default:
                console.error('Invalid provider');
                process.exit(1);
        }

        const crawler = new Crawler(process.cwd());
        const files = await crawler.crawl(config.include, config.exclude);

        console.log(`Crawled ${files.length} files.`);

        const generator = new DocGenerator(provider, path.resolve(process.cwd(), config.output || './docs'));

        console.log('Generating README.md...');
        await generator.generateReadme(files);

        console.log(`Documentation generated in ${config.output}`);
    });

program.parse(process.argv);
