import { LLMProvider } from '../llm/adapter.js';
import type { FileInfo } from '../crawler/crawler.js';
import { CodeParser } from '../parser/parser.js';
import type { ParsedFile } from '../parser/parser.js';
import { RelationshipGraph } from '../context/graph.js';
import { IntelligentChunker } from '../context/chunker.js';
import * as fs from 'fs';
import * as path from 'path';

export class DocGenerator {
    private provider: LLMProvider;
    private outputDir: string;
    private parser: CodeParser;
    private graph: RelationshipGraph;
    private chunker: IntelligentChunker;

    constructor(provider: LLMProvider, outputDir: string) {
        this.provider = provider;
        this.outputDir = outputDir;
        this.parser = new CodeParser();
        this.graph = new RelationshipGraph();
        this.chunker = new IntelligentChunker();

        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    async generateReadme(files: FileInfo[]): Promise<string> {
        const parsedFiles: ParsedFile[] = [];

        // Parse all files for global context
        for (const file of files) {
            try {
                if (file.extension === '.ts' || file.extension === '.js') {
                    parsedFiles.push(this.parser.parseFile(file.content, file.path));
                }
            } catch (e) {
                console.warn(`Could not parse ${file.name}, skipping structural analysis for it.`);
            }
        }

        // Build relationship graph
        this.graph.build(parsedFiles);

        const projectTree = files.map(f => f.path.replace(process.cwd(), '.')).join('\n');
        const structuralSummary = parsedFiles.map(pf => {
            const relPath = path.relative(process.cwd(), pf.path);
            const classes = pf.classes.map(c => c.name).join(', ');
            const funcs = pf.functions.map(f => f.name).join(', ');
            return `### ${relPath}\n- Classes: ${classes || 'N/A'}\n- Functions: ${funcs || 'N/A'}`;
        }).join('\n');

        const prompt = `
      You are an elite technical documentation specialist. Generate a professional, high-quality README.md for this project.
      
      ## Project Structure
      ${projectTree}

      ## Architecture Overview (Structural Analysis)
      ${structuralSummary}

      ## Core Logic Snippets
      ${files.slice(0, 5).map(f => `### ${f.name}\n\`\`\`typescript\n${f.content.substring(0, 1000)}\n\`\`\``).join('\n\n')}

      Guidelines:
      1. Provide a clear and concise project description.
      2. Group features logically.
      3. Use the structural analysis to explain how modules interact.
      4. Ensure the tone is professional and suitable for a production repository.
      5. Include any identified dependencies.
    `;

        try {
            const response = await this.provider.generate(prompt, "You are a professional documentation architect.");
            const readmePath = path.join(this.outputDir, 'README.md');
            fs.writeFileSync(readmePath, response.content);
            return readmePath;
        } catch (error: any) {
            console.error('Error generating README.md:');
            console.error(`  - ${error.message}`);
            throw error;
        }
    }

    async generateFileDocs(files: FileInfo[]): Promise<void> {
        for (const file of files) {
            const relPath = path.relative(process.cwd(), file.path);
            let structuralContext = '';

            try {
                if (file.extension === '.ts' || file.extension === '.js') {
                    const parsed = this.parser.parseFile(file.content, file.path);
                    const dependencies = this.graph.getDependencies(file.path).map(d => path.relative(process.cwd(), d));
                    const dependents = this.graph.getDependents(file.path).map(d => path.relative(process.cwd(), d));

                    structuralContext = `
            ### Structural Context
            - **Classes**: ${parsed.classes.map(c => `${c.name} (${c.methods.join(', ')})`).join('; ') || 'None'}
            - **Exported Functions**: ${parsed.functions.filter(f => f.isExported).map(f => f.name).join(', ') || 'None'}
            - **Internal Functions**: ${parsed.functions.filter(f => !f.isExported).map(f => f.name).join(', ') || 'None'}
            - **Dependencies (Imports)**: ${dependencies.join(', ') || 'None'}
            - **Dependents (Imported By)**: ${dependents.join(', ') || 'None'}
          `;
                }
            } catch (e) {
                // Fallback to basic content
            }

            const prompt = `
        Document the source file: \`${relPath}\`
        
        ${structuralContext}

        ## Source Code
        \`\`\`typescript
        ${file.content.length > 8000 ? file.content.substring(0, 8000) + '\n// ... [Code Truncated for Length]' : file.content}
        \`\`\`

        Instructions:
        1. Explain the primary responsibility of this file.
        2. Describe the purpose of each exported class and function.
        3. Highlight how this file fits into the overall project architecture based on its dependencies and dependents.
        4. Maintain a formal, technical tone.
      `;

            try {
                const response = await this.provider.generate(prompt, "You are a senior developer writing technical documentation.");
                const docPath = path.join(this.outputDir, `${file.name}.md`);
                fs.writeFileSync(docPath, response.content);
            } catch (error: any) {
                console.error(`Error generating documentation for ${file.name}: ${error.message}`);
            }
        }
    }
}
