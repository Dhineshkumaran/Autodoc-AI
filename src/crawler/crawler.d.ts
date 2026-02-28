export interface FileInfo {
    path: string;
    name: string;
    extension: string;
    content: string;
}
export declare class Crawler {
    private baseDir;
    private ig;
    constructor(baseDir: string);
    private loadGitignore;
    crawl(include?: string[], exclude?: string[]): Promise<FileInfo[]>;
}
//# sourceMappingURL=crawler.d.ts.map