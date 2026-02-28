import { parse, TSESTree } from '@typescript-eslint/typescript-estree';

export interface ParsedImport {
    source: string;
    specifiers: string[];
}

export interface ParsedFunction {
    name: string;
    params: string[];
    async: boolean;
    isExported: boolean;
    range: [number, number];
}

export interface ParsedClass {
    name: string;
    methods: string[];
    isExported: boolean;
    range: [number, number];
}

export interface ParsedFile {
    path: string;
    imports: ParsedImport[];
    classes: ParsedClass[];
    functions: ParsedFunction[];
}

export class CodeParser {
    public parseFile(content: string, filePath: string): ParsedFile {
        const ast = parse(content, {
            filePath,
            range: true,
            loc: true,
            tokens: false,
            comment: false,
        });

        const result: ParsedFile = {
            path: filePath,
            imports: [],
            classes: [],
            functions: [],
        };

        this.traverse(ast, result);

        return result;
    }

    private traverse(node: any, result: ParsedFile) {
        if (!node || typeof node !== 'object') return;

        // Handle Imports
        if (node.type === 'ImportDeclaration') {
            result.imports.push({
                source: node.source.value,
                specifiers: node.specifiers.map((s: any) => s.local.name),
            });
        }

        // Handle Classes
        if (node.type === 'ClassDeclaration' ||
            (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'ClassDeclaration') ||
            (node.type === 'ExportDefaultDeclaration' && node.declaration?.type === 'ClassDeclaration')) {

            const isExported = node.type.startsWith('Export');
            const classNode = node.type === 'ClassDeclaration' ? node : node.declaration;

            result.classes.push({
                name: classNode.id?.name || 'AnonymousClass',
                methods: classNode.body.body
                    .filter((m: any) => m.type === 'MethodDefinition')
                    .map((m: any) => m.key.name),
                isExported,
                range: node.range,
            });
        }

        // Handle Functions (Declarations)
        if (node.type === 'FunctionDeclaration' ||
            (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'FunctionDeclaration') ||
            (node.type === 'ExportDefaultDeclaration' && node.declaration?.type === 'FunctionDeclaration')) {

            const isExported = node.type.startsWith('Export');
            const funcNode = node.type === 'FunctionDeclaration' ? node : node.declaration;

            result.functions.push({
                name: funcNode.id?.name || 'AnonymousFunction',
                params: funcNode.params.map((p: any) => p.name || (p.left ? p.left.name : 'arg')),
                async: funcNode.async,
                isExported,
                range: node.range,
            });
        }

        // Handle Variable-based functions (e.g., const foo = () => {})
        if (node.type === 'VariableDeclaration') {
            const isExported = node.parent?.type === 'ExportNamedDeclaration';
            node.declarations.forEach((decl: any) => {
                if (decl.init && (decl.init.type === 'ArrowFunctionExpression' || decl.init.type === 'FunctionExpression')) {
                    result.functions.push({
                        name: decl.id.name,
                        params: decl.init.params.map((p: any) => p.name || 'arg'),
                        async: decl.init.async,
                        isExported: isExported,
                        range: (isExported ? node.parent : node).range,
                    });
                }
            });
        }

        // Recursively traverse children
        for (const key in node) {
            if (key === 'parent') continue; // Avoid circularity if parent links exist
            if (Array.isArray(node[key])) {
                node[key].forEach((child: any) => this.traverse(child, result));
            } else if (node[key] && typeof node[key] === 'object' && node[key].type) {
                this.traverse(node[key], result);
            }
        }
    }
}
