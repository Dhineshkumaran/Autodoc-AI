import * as path from 'path';
import type { ParsedFile } from '../parser/parser.js';

export interface FileNode {
    path: string;
    imports: string[]; // Paths to other files this file imports
    importedBy: string[]; // Paths to files that import this file
}

export class RelationshipGraph {
    private nodes: Map<string, FileNode> = new Map();

    public build(files: ParsedFile[]) {
        // Initialize nodes
        files.forEach(file => {
            this.nodes.set(path.normalize(file.path), {
                path: path.normalize(file.path),
                imports: [],
                importedBy: [],
            });
        });

        const extensions = ['.ts', '.js', '.tsx', '.jsx', '/index.ts', '/index.js'];

        // Resolve dependencies
        files.forEach(file => {
            const currentFilePath = path.normalize(file.path);
            const node = this.nodes.get(currentFilePath)!;
            const currentDir = path.dirname(currentFilePath);

            file.imports.forEach(imp => {
                let resolvedPath: string | null = null;

                if (imp.source.startsWith('.')) {
                    // Relative import
                    const fullPath = path.resolve(currentDir, imp.source);

                    // Try exact match first
                    if (this.nodes.has(fullPath)) {
                        resolvedPath = fullPath;
                    } else {
                        // Try with extensions
                        for (const ext of extensions) {
                            const pathWithExt = path.normalize(fullPath + ext);
                            if (this.nodes.has(pathWithExt)) {
                                resolvedPath = pathWithExt;
                                break;
                            }
                        }
                    }
                }

                if (resolvedPath) {
                    node.imports.push(resolvedPath);
                    const otherNode = this.nodes.get(resolvedPath);
                    if (otherNode && !otherNode.importedBy.includes(currentFilePath)) {
                        otherNode.importedBy.push(currentFilePath);
                    }
                }
            });
        });
    }

    public getDependencies(path: string): string[] {
        return this.nodes.get(path)?.imports || [];
    }

    public getDependents(path: string): string[] {
        return this.nodes.get(path)?.importedBy || [];
    }

    public getAllNodes(): FileNode[] {
        return Array.from(this.nodes.values());
    }
}
