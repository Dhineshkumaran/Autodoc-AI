import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import ignore from 'ignore';
export class Crawler {
    baseDir;
    ig;
    constructor(baseDir) {
        this.baseDir = baseDir;
        this.ig = ignore();
        this.loadGitignore();
    }
    loadGitignore() {
        const gitignorePath = path.join(this.baseDir, '.gitignore');
        if (fs.existsSync(gitignorePath)) {
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
            this.ig.add(gitignoreContent);
        }
        // Always ignore node_modules and .git
        this.ig.add(['node_modules', '.git', 'dist', 'docs']);
    }
    async crawl(include = ['**/*'], exclude = []) {
        const files = await glob(include, {
            cwd: this.baseDir,
            ignore: exclude,
            nodir: true,
            absolute: true,
        });
        const filteredFiles = files.filter(file => {
            const relativePath = path.relative(this.baseDir, file);
            return !this.ig.ignores(relativePath);
        });
        const fileInfos = [];
        for (const file of filteredFiles) {
            const content = fs.readFileSync(file, 'utf8');
            fileInfos.push({
                path: file,
                name: path.basename(file),
                extension: path.extname(file),
                content,
            });
        }
        return fileInfos;
    }
}
//# sourceMappingURL=crawler.js.map