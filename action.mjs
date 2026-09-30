#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import {
  buildSolumbeArgs,
  parseInvocationContext,
  requestFromContext,
  resolveBase,
  resolveRepoRoot,
  runSolumbe,
} from "./runtime.mjs";

export function runAction(action, options = {}) {
  const context = options.context ?? parseInvocationContext();
  if (action === "doctor") {
    return runSolumbe(buildSolumbeArgs(action, {}));
  }

  const repo = options.repo ?? resolveRepoRoot(context);
  const request = requestFromContext(action, context, options.request);
  const base = options.base ?? resolveBase(repo);
  process.stdout.write(
    `Solumbe · ${action}\nRepository: ${repo}\nRequest: ${request}\n\n`,
  );
  return runSolumbe(buildSolumbeArgs(action, { repo, request, base }), {
    cwd: repo,
  });
}

export function main(argv = process.argv.slice(2)) {
  const action = argv[0];
  if (!action) throw new Error("Expected an Solumbe Herdr action name.");
  const result = runAction(action);
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMain) {
  try {
    main();
  } catch (error) {
    process.stderr.write(
      `Solumbe Herdr plugin: ${error.message ?? String(error)}\n`,
    );
    process.exitCode = 1;
  }
}
