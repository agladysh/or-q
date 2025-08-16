import { loadModuleAssets, type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

// Ollama commands
import ollamaGenerate from './commands/ollama/ollama-generate.ts';
import ollamaChat from './commands/ollama/ollama-chat.ts';

// OpenAI compatibility commands
import ollama from './commands/openai/ollama.ts';

const plugin: Plugin = {
  name: pkg.name,
  description: pkg.description,
  assets: loadModuleAssets(import.meta.url),
  commands: {
    'ollama-generate': ollamaGenerate,
    'ollama-chat': ollamaChat,
    ollama: ollama,
  },
};

export default plugin;
