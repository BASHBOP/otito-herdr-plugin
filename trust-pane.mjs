#!/usr/bin/env node

import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { pathToFileURL } from "node:url";
import {
  buildSolumbeArgs,
  parseInvocationContext,
  resolveBase,
  resolveRepoRoot,
  runSolumbe,
} from "./runtime.mjs";

function clear() {
  if (stdout.isTTY) stdout.write("\u001b[2J\u001b[H");
}

function glyph(verdict) {
  if (verdict === "PASS") return "PASS";
  if (verdict === "FAIL") return "FAIL";
  return "WARN";
}

export function formatTrustSummary(report, repo, base) {
  const checks = report.pass?.checks ?? [];
  const attention = checks.filter((check) => check.status !== "PASS");
  const lines = [
    "SOLUMBE TRUST STATUS",
    "Models generate the change. Solumbe proves whether it is safe to merge.",
    "",
    `Repository  ${repo}`,
    `Base        ${base ?? "not detected"}`,
    `Verdict     ${glyph(report.verdict)} · confidence ${report.confidence ?? "?"}%`,
    `Change      ${report.prReviewSummary?.changedFiles ?? 0} file(s) · +${report.prReviewSummary?.additions ?? 0} -${report.prReviewSummary?.deletions ?? 0}`,
    `Risk        ${report.prReviewSummary?.riskLevel ?? "unknown"}`,
  ];

  if (attention.length) {
    lines.push("", "Needs attention");
    for (const check of attention) {
      lines.push(
        `  ${check.status.padEnd(4)}  ${check.name}: ${check.summary}`,
      );
    }
  }

  lines.push(
    "",
    "Local evidence does not replace hosted CI, CODEOWNERS approval, unresolved-comment checks, or the human merge decision.",
  );
  return lines.join("\n");
}

function readReport(repo, base, request) {
  const args = ["review", repo, "--request", request, "--json"];
  if (base) args.push("--base", base);
  const result = runSolumbe(args, { cwd: repo, capture: true });
  if (result.error) throw result.error;
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    throw new Error(
      result.stderr.trim() || "Solumbe returned unreadable review data.",
    );
  }
  if (report.ok === false) {
    throw new Error(report.error || "Solumbe could not generate a review.");
  }
  return report;
}

async function runInteractiveCommand(rl, action, repo, base) {
  let request;
  if (action === "context" || action === "impact" || action === "gate-staged") {
    request = (await rl.question("Change request: ")).trim();
    if (!request) return;
  }
  const args = buildSolumbeArgs(action, { repo, request, base });
  stdout.write("\n");
  const result = runSolumbe(args, { cwd: repo });
  if (result.error) throw result.error;
  await rl.question("\nPress Enter to return to trust status...");
}

export async function main() {
  const context = parseInvocationContext();
  const repo = resolveRepoRoot(context);
  const base = resolveBase(repo);
  const rl = createInterface({ input: stdin, output: stdout });
  let request = "Review current changes before merge";

  try {
    for (;;) {
      clear();
      try {
        const report = readReport(repo, base, request);
        stdout.write(`${formatTrustSummary(report, repo, base)}\n`);
      } catch (error) {
        stdout.write(
          `SOLUMBE TRUST STATUS\n\n${error.message ?? String(error)}\n`,
        );
      }

      stdout.write(
        "\n[r] refresh  [c] context  [i] impact  [g] validate staged  [d] doctor  [q] close\n",
      );
      const choice = (await rl.question("> ")).trim().toLowerCase();
      if (choice === "q") break;
      if (choice === "r" || choice === "") continue;

      try {
        if (choice === "c") {
          await runInteractiveCommand(rl, "context", repo, base);
        } else if (choice === "i") {
          const nextRequest = (await rl.question("Change request: ")).trim();
          if (nextRequest) {
            request = nextRequest;
            const result = runSolumbe(
              buildSolumbeArgs("impact", { repo, request, base }),
              { cwd: repo },
            );
            if (result.error) throw result.error;
            await rl.question("\nPress Enter to return to trust status...");
          }
        } else if (choice === "g") {
          await runInteractiveCommand(rl, "gate-staged", repo, base);
        } else if (choice === "d") {
          const result = runSolumbe(["doctor"], { cwd: repo });
          if (result.error) throw result.error;
          await rl.question("\nPress Enter to return to trust status...");
        }
      } catch (error) {
        stdout.write(`\nError: ${error.message ?? String(error)}\n`);
        await rl.question("Press Enter to continue...");
      }
    }
  } finally {
    rl.close();
  }
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMain) {
  main().catch((error) => {
    process.stderr.write(
      `Solumbe Herdr plugin: ${error.message ?? String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
