import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import ignore from 'ignore';

export interface FileInfo {
    path: string;
    name: string;
    extension: string;
    content: string;
    size?: number;
}

export class Crawler {
    private baseDir: string;
    private ig: ReturnType<typeof ignore>;

    constructor(baseDir: string) {
        this.baseDir = path.resolve(baseDir);
        this.ig = ignore();
        this.loadGitignore();
    }

    private loadGitignore() {
        try {
            const gitignorePath = path.join(this.baseDir, '.gitignore');
            if (fs.existsSync(gitignorePath)) {
                const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
                this.ig.add(gitignoreContent);
            }
        } catch (error) {
            console.warn('Could not load .gitignore, proceeding with default ignores.');
        }
        // Always ignore common non-source directories
        this.ig.add(['node_modules', '.git', 'dist', 'docs', '.DS_Store', 'coverage', '.env']);
    }

    public async crawl(include: string[] = ['**/*'], exclude: string[] = []): Promise<FileInfo[]> {
        console.log(`Scanning directory: ${this.baseDir}`);

        const files = await glob(include, {
            cwd: this.baseDir,
            ignore: exclude,
            nodir: true,
            absolute: true,
            dot: true, // Include hidden files like .env or .autodocrc
        });

        const filteredFiles = files.filter(file => {
            const relativePath = path.relative(this.baseDir, file);
            return !this.ig.ignores(relativePath);
        });

        const fileInfos: FileInfo[] = [];
        for (const file of filteredFiles) {
            try {
                const stats = fs.statSync(file);
                // Skip files larger than 1MB to avoid context window issues
                if (stats.size > 1024 * 1024) {
                    console.warn(`Skipping large file: ${path.relative(this.baseDir, file)} (${(stats.size / 1024).toFixed(2)} KB)`);
                    continue;
                }

                const content = fs.readFileSync(file, 'utf8');
                fileInfos.push({
                    path: file,
                    name: path.basename(file),
                    extension: path.extname(file),
                    content,
                    size: stats.size,
                });
            } catch (error) {
                console.error(`Error reading file ${file}:`, error);
            }
        }

        return fileInfos;
    }
}
