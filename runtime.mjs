import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = dirname(fileURLToPath(import.meta.url));

export const DEFAULT_REQUESTS = Object.freeze({
  context: "Summarize this repository for the current task",
  impact: "Review the current working tree changes and identify affected files",
  review: "Review current changes before merge",
  "gate-staged": "Validate the exact staged change before commit",
});

export function parseInvocationContext(
  raw = process.env.HERDR_PLUGIN_CONTEXT_JSON,
) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

export function requestFromContext(action, context, override) {
  const explicit = String(override ?? process.env.SOLUMBE_REQUEST ?? "").trim();
  if (explicit) return explicit;
  const selection = String(context.selected_text ?? "").trim();
  return selection || DEFAULT_REQUESTS[action] || DEFAULT_REQUESTS.review;
}

function git(args, cwd) {
  return spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

export function resolveRepoRoot(context = parseInvocationContext()) {
  const candidates = [
    process.env.SOLUMBE_REPO,
    context.focused_pane_cwd,
    context.worktree?.checkout_path,
    context.workspace_cwd,
    process.env.HERDR_ACTIVE_PANE_CWD,
    process.cwd(),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const result = git(
      ["-C", String(candidate), "rev-parse", "--show-toplevel"],
      pluginRoot,
    );
    if (result.status === 0) return result.stdout.trim();
  }

  throw new Error(
    "No Git repository was found for the active Herdr pane. Focus a pane inside a repository and try again.",
  );
}

export function resolveBase(repo) {
  const symbolic = git(
    ["-C", repo, "symbolic-ref", "--quiet", "refs/remotes/origin/HEAD"],
    pluginRoot,
  );
  if (symbolic.status === 0) {
    return symbolic.stdout.trim().replace(/^refs\/remotes\//, "");
  }

  for (const candidate of ["origin/main", "origin/master", "main", "master"]) {
    const found = git(
      ["-C", repo, "rev-parse", "--verify", "--quiet", candidate],
      pluginRoot,
    );
    if (found.status === 0) return candidate;
  }
  return undefined;
}

export function resolveSolumbeCommand(env = process.env) {
  const configured = String(env.SOLUMBE_BIN ?? "").trim();
  if (configured) return { command: configured, prefix: [] };

  const bundledCli = resolve(
    pluginRoot,
    "node_modules",
    "@bashbop",
    "solumbe",
    "src",
    "cli.js",
  );
  if (existsSync(bundledCli)) {
    return { command: process.execPath, prefix: [bundledCli] };
  }

  const installed = spawnSync("solumbe", ["--version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (installed.status === 0) return { command: "solumbe", prefix: [] };

  throw new Error(
    "Solumbe is unavailable. Reinstall this plugin so its locked dependency is built, or set SOLUMBE_BIN to an Solumbe executable.",
  );
}

export function buildSolumbeArgs(action, { repo, request, base }) {
  if (action === "doctor") return ["doctor"];
  if (action === "context") {
    return ["context", request, "--path", repo];
  }
  if (action === "impact") {
    const args = ["impact", repo, request, "--top", "20"];
    if (base) args.push("--diff-base", base);
    return args;
  }
  if (action === "review") {
    const args = ["review", repo, "--request", request];
    if (base) args.push("--base", base);
    return args;
  }
  if (action === "gate-staged") {
    const args = [
      "gate",
      repo,
      "--staged",
      "--run-validation",
      "--request",
      request,
    ];
    if (base) args.push("--base", base);
    return args;
  }
  throw new Error(`Unknown Solumbe Herdr action: ${action}`);
}

export function runSolumbe(args, options = {}) {
  const executable = resolveSolumbeCommand();
  const capture = options.capture ?? false;
  return spawnSync(executable.command, [...executable.prefix, ...args], {
    cwd: options.cwd,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
}
