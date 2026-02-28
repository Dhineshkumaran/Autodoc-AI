import type { ParsedFile, ParsedClass, ParsedFunction } from '../parser/parser.js';

export interface CodeChunk {
    type: 'class' | 'function' | 'module' | 'other';
    name: string;
    content: string;
}

export class IntelligentChunker {
    private maxChunkSize: number = 4000; // Characters

    public chunk(parsedFile: ParsedFile, rawContent: string): CodeChunk[] {
        const chunks: CodeChunk[] = [];

        // Extract Classes using AST ranges
        parsedFile.classes.forEach(cls => {
            const content = rawContent.substring(cls.range[0], cls.range[1]);
            chunks.push({
                type: 'class',
                name: cls.name,
                content: content,
            });
        });

        // Extract Top-level Functions using AST ranges
        parsedFile.functions.forEach(func => {
            const content = rawContent.substring(func.range[0], func.range[1]);
            chunks.push({
                type: 'function',
                name: func.name,
                content: content,
            });
        });

        // Fallback for files without structural elements
        if (chunks.length === 0) {
            chunks.push({
                type: 'module',
                name: parsedFile.path,
                content: rawContent.substring(0, this.maxChunkSize),
            });
        }

        return chunks;
    }
}
