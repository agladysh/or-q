import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execPromise = promisify(exec);

// Lazy. This should run only if plugin list was changed
// (e.g. via a pre-commit lefthook, which means we should fail if the file was updated or something)
async function main() {
  console.log('Generating plugin dependencies for @or-q/cli-plugins...');

  // 1. Execute `pnpm -w list --depth=0 --json` to get all dependencies
  // NB: Wildcard filtering seems to limit output to 10 entries in JSON mode
  console.log('Listing OR-Q plugins...');
  const { stdout: pnpmListOutput } = await execPromise('pnpm -w list --depth=0 --json');
  const pnpmListJson = JSON.parse(pnpmListOutput);

  // Example output structure:
  // [
  //   {
  //     "name": "@or-q/workspace",
  //     "version": "1.0.0",
  //     "path": "/Users/agladysh/projects/or-q",
  //     "private": true,
  //     "dependencies": {
  //       "@or-q/plugin-alias": { ... },
  //       "@or-q/plugin-core": { ... },
  //       // ... other plugins and dependencies
  //     }
  //   }
  // ]

  if (!pnpmListJson || pnpmListJson.length === 0 || !pnpmListJson[0].dependencies) {
    throw new Error('Unexpected pnpm list output format.');
  }

  const allDependencies = pnpmListJson[0].dependencies;

  // 2. Build a list of tuples <package-name>: "workspace:*"
  const dependenciesToAdd: { [key: string]: string } = {
    '@or-q/cli': 'workspace:*', // 3. Add @or-q/cli: workspace:*
  };

  // 3. Filter and add @or-q/plugin-* dependencies directly
  for (const depName of Object.keys(allDependencies)) {
    if (depName.startsWith('@or-q/plugin-')) {
      dependenciesToAdd[depName] = 'workspace:*';
    }
  }

  // 4. Run `pnpm pkg set` to add all dependencies in one go
  console.log('Adding new plugin dependencies...');
  const dependencyArgs = Object.keys(dependenciesToAdd)
    .sort()
    .map((depName) => `dependencies.${depName}=${dependenciesToAdd[depName]}`)
    .join(' ');

  await execPromise(`pnpm pkg set ${dependencyArgs}`);

  // 5. Report success
  console.log('Successfully generated plugin dependencies for @or-q/cli-plugins.');
}

main()
  .catch((e: unknown) => {
    console.error('Unexpected error:', e);
    process.exitCode = 1;
  })
  .finally(() => {
    process.stdin.destroy();
  });
