import { LLMProvider } from '../llm/adapter.js';
import * as fs from 'fs';
import * as path from 'path';
export class DocGenerator {
    provider;
    outputDir;
    constructor(provider, outputDir) {
        this.provider = provider;
        this.outputDir = outputDir;
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }
    async generateReadme(files) {
        const fileStructure = files.map(f => f.path).join('\n');
        const prompt = `
      You are an expert technical writer. Based on the following project file structure and snippets from key files, generate a comprehensive README.md.
      Include a project overview, installation instructions (if identifiable), and a brief description of the core modules.

      File Structure:
      ${fileStructure}

      Key File Snippets (First 500 chars):
      ${files.slice(0, 10).map(f => `${f.name}:\n${f.content.substring(0, 500)}`).join('\n\n')}
    `;
        const response = await this.provider.generate(prompt, "You generate high-quality project documentation.");
        const readmePath = path.join(this.outputDir, 'README.md');
        fs.writeFileSync(readmePath, response.content);
        return readmePath;
    }
    async generateFileDocs(files) {
        for (const file of files) {
            const prompt = `
        Document the following file: ${file.name}
        Content:
        ${file.content}

        Provide a summary of the file's purpose, exported classes/functions, and major dependencies.
      `;
            const response = await this.provider.generate(prompt, "You generate detailed file-level documentation.");
            const docPath = path.join(this.outputDir, `${file.name}.md`);
            fs.writeFileSync(docPath, response.content);
        }
    }
}
//# sourceMappingURL=doc-generator.js.map