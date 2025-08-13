/*
 * 1. Core modules
 *    `require('module').builtinModules` is an official, documented array
 *    containing the names of all built-ins (fs, http, util, etc.).
 */
const { builtinModules } = require('module');
const { globSync } = require('glob');
const yaml = require('yaml');

/*
 * 2. Everything that can be found in any "node_modules" directory
 *    that Node’s resolver will actually look at.
 *
 *    We walk the same directories that `require.resolve()` walks:
 *      * Each directory in require.resolve.paths(__filename)
 *      * Plus any global folders returned by `require('module').globalPaths`
 *
 *    For every directory in that list we:
 *      - stat it (skip if it doesn’t exist)
 *      - list its sub-directories
 *      - filter out names that start with “@” (scoped packages are
 *        handled below)
 *      - also look inside each “@scope” directory for individual scoped
 *        packages (@babel/core, @types/node, …)
 *
 *    We collect everything in a Set to deduplicate and to preserve
 *    insertion order.
 */
const fs = require('fs');
const path = require('path');

function allNodeModulesPaths() {
  // 1. Per-project upwards search
  const projectPaths = require.resolve.paths(__filename) || [];
  // 2. Global folders that Node adds unconditionally
  const globalPaths = require('module').globalPaths || [];
  return [...new Set([...projectPaths, ...globalPaths])];
}

function listModulesIn(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const packages = [];

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

      if (entry.name.startsWith('@')) {
        // Scoped packages: look one level deeper
        const scopeDir = path.join(dir, entry.name);
        try {
          const scopedEntries = fs.readdirSync(scopeDir, {
            withFileTypes: true,
          });
          for (const scopedEntry of scopedEntries) {
            if (scopedEntry.isDirectory()) {
              packages.push(`${entry.name}/${scopedEntry.name}`);
            }
          }
        } catch {
          /* ignore unreadable scopes */
        }
      } else {
        // Regular package
        packages.push(entry.name);
      }
    }
    return packages;
  } catch {
    // Directory doesn’t exist or isn’t readable → ignore
    return [];
  }
}

function workspaceRoot(cwd = path.dirname(__filename)) {
  let dir = cwd;
  while (dir !== path.dirname(dir)) {
    const hasPnpmWs = fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'));
    if (hasPnpmWs) return dir;

    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pj = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pj.workspaces) return dir; // npm/yarn workspace root
      } catch {
        /* ignore unreadable */
      }
    }
    dir = path.dirname(dir);
  }
  // fell off the top → no workspace root
}

function workspacePackages() {
  const root = workspaceRoot();
  if (!root) return [];

  // 1. collect glob patterns
  let globs = [];
  const wsFile = path.join(root, 'pnpm-workspace.yaml');
  if (fs.existsSync(wsFile)) {
    const doc = yaml.parse(fs.readFileSync(wsFile, 'utf8'));
    globs = doc.packages || [];
  } else {
    const pj = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    globs = pj.workspaces || [];
  }

  // 2. expand globs synchronously
  const dirs = globs.flatMap((g) => globSync(g, { cwd: root, absolute: true, onlyDirectories: true }));

  // 3. read package.json in each dir and extract name
  const names = [];
  for (const dir of dirs) {
    try {
      const pkgPath = path.join(dir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const { name } = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (name) names.push(name);
      }
    } catch {
      /* ignore unreadable */
    }
  }
  return names;
}

function installedNodeModules(withWorkspace = true) {
  const fromWorkspace = withWorkspace ? workspacePackages() : [];
  return [...new Set([...builtinModules, ...allNodeModulesPaths().flatMap(listModulesIn), ...fromWorkspace])];
}

module.exports = installedNodeModules;
