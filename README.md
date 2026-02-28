# Autodoc-AI

AI-Powered Project Documentation Generator using LLMs (Claude, OpenAI, Groq, Ollama).

Autodoc-AI is a CLI tool that automatically generates high-quality technical documentation for your codebase. It uses Abstract Syntax Trees (AST) to understand the structure of your code and leverages Large Language Models to write professional READMEs and file-level documentation.

## Features

- 🌟 **AI-Powered**: Uses state-of-the-art LLMs to write documentation.
- 🛠️ **Interactive Setup**: Simple `init` command to configure your project.
- 📊 **Structural Analysis**: Understands classes, functions, and file relationships via AST parsing.
- 🔌 **Multi-Provider**: Supports Claude, OpenAI, Groq, and local models via Ollama.
- ⚙️ **Configurable**: Fine-tune includes/excludes via `.autodocrc.json`.
- 🚀 **NPM Ready**: Designed for professional use in modern TypeScript/JavaScript projects.

## Installation

```bash
# Install globally
npm install -g autodoc-ai

# Or install in your project
npm install --save-dev autodoc-ai
```

## Quick Start

### 1. Initialize Configuration
Run the interactive setup to create your `.autodocrc.json` file:
```bash
autodoc-ai init
```

### 2. Set Up Environment Variables
Create a `.env` file in your project root with your API keys:
```env
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
```

### 3. Generate Documentation
Run the documentation generation:
```bash
autodoc-ai generate
```
By default, this will scan your project and generate a `README.md` in the `./docs` folder.

## Usage

### CLI Commands

- `autodoc-ai init`: Starts an interactive wizard to configure the project.
- `autodoc-ai generate`: Scans the codebase and generates documentation.
  - `-p, --provider`: Override the provider (claude, openai, groq, ollama).
  - `-m, --model`: Override the model name.
  - `-o, --output`: Specify output directory (default: `./docs`).
  - `-i, --include`: Glob patterns to include.
  - `-e, --exclude`: Glob patterns to exclude.

## Configuration (.autodocrc.json)

You can customize the tool's behavior using a configuration file:

```json
{
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "output": "./docs",
    "include": ["src/**/*"],
    "exclude": ["**/*.test.ts"]
}
```

## Architecture

Autodoc-AI is built with a modular architecture:
- **Crawler**: Intelligent file system traversal with `.gitignore` support.
- **Code Parser**: Uses `@typescript-eslint/parser` for precise AST analysis.
- **Relationship Graph**: Maps dependencies and dependents between files.
- **Intelligent Chunker**: Efficiently feeds code segments to LLMs.
- **Adapter Layer**: Unified interface for various AI providers.

## License

This project is open-source and available under the [MIT License](LICENSE).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
