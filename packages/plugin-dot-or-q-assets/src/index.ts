import { loadAssets, type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };
import path from 'node:path';

const plugin: Plugin = {
  name: pkg.name,
  description: pkg.description,
  // Lazy. This should support normal hierarchy of .or-q directories (upwards, home, XDG, system, etc.)
  assets: loadAssets(path.join(process.cwd(), '.or-q/assets/')),
};

export default plugin;
