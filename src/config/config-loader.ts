import * as fs from 'fs';
import * as path from 'path';

export interface AutodocConfig {
    provider?: 'claude' | 'openai' | 'ollama' | 'groq';
    model?: string;
    output?: string;
    include?: string[];
    exclude?: string[];
    generate?: string[];
}

export class ConfigLoader {
    private configFile = '.autodocrc.json';

    public loadConfig(baseDir: string): AutodocConfig {
        const configPath = path.join(baseDir, this.configFile);
        if (fs.existsSync(configPath)) {
            try {
                const content = fs.readFileSync(configPath, 'utf8');
                return JSON.parse(content);
            } catch (error) {
                console.warn(`⚠️ Failed to parse ${this.configFile}:`, error);
            }
        }
        return {};
    }

    public mergeConfig(cliOptions: any, fileConfig: AutodocConfig): AutodocConfig {
        return {
            provider: cliOptions.provider || fileConfig.provider || 'claude',
            model: cliOptions.model || fileConfig.model,
            output: cliOptions.output || fileConfig.output || './docs',
            include: cliOptions.include || fileConfig.include || ['**/*'],
            exclude: cliOptions.exclude || fileConfig.exclude || [],
            generate: fileConfig.generate || ['readme'],
        };
    }
}
