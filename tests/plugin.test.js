import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_REQUESTS,
  buildOtitoArgs,
  parseInvocationContext,
  requestFromContext,
  resolveRepoRoot,
  resolveOtitoCommand,
} from "../runtime.mjs";
import { formatTrustSummary } from "../trust-pane.mjs";

const manifestPath = fileURLToPath(
  new URL("../herdr-plugin.toml", import.meta.url),
);

test("manifest exposes the bounded Otito trust workflow", () => {
  const manifest = readFileSync(manifestPath, "utf8");
  assert.match(manifest, /id = "bashbop\.otito"/);
  assert.match(manifest, /min_herdr_version = "0\.8\.2"/);
  assert.match(manifest, /command = \["npm", "ci", "--ignore-scripts"\]/);
  for (const action of [
    "doctor",
    "context",
    "impact",
    "review",
    "gate-staged",
  ]) {
    assert.match(manifest, new RegExp(`id = "${action}"`));
  }
  assert.match(manifest, /id = "trust-status"/);
  assert.doesNotMatch(manifest, /command = \[[^\n]*(merge|push|commit)/);
});

test("invocation context is defensive and selected text becomes the request", () => {
  assert.deepEqual(parseInvocationContext("not-json"), {});
  const context = parseInvocationContext(
    JSON.stringify({ selected_text: "Add a safe Herdr integration" }),
  );
  assert.equal(
    requestFromContext("impact", context),
    "Add a safe Herdr integration",
  );
  assert.equal(requestFromContext("review", {}), DEFAULT_REQUESTS.review);
});

test("an explicit Otito executable overrides bundled and global resolution", () => {
  assert.deepEqual(resolveOtitoCommand({ OTITO_BIN: "/opt/otito" }), {
    command: "/opt/otito",
    prefix: [],
  });
});

test("direct local invocation falls back to the current Git repository", () => {
  assert.equal(resolveRepoRoot({}), process.cwd());
});

test("staged gate arguments bind request, base, validation, and staged tree", () => {
  const args = buildOtitoArgs("gate-staged", {
    repo: "/tmp/repo",
    request: "ship the plugin",
    base: "origin/main",
  });
  assert.deepEqual(args, [
    "gate",
    "/tmp/repo",
    "--staged",
    "--run-validation",
    "--request",
    "ship the plugin",
    "--base",
    "origin/main",
  ]);
});

test("trust status keeps hosted and human authority explicit", () => {
  const output = formatTrustSummary(
    {
      verdict: "WARN",
      confidence: 70,
      prReviewSummary: {
        changedFiles: 2,
        additions: 12,
        deletions: 3,
        riskLevel: "medium",
      },
      pass: {
        checks: [
          {
            status: "WARN",
            name: "Review state",
            summary: "Hosted review is not available locally.",
          },
        ],
      },
    },
    "/tmp/repo",
    "origin/main",
  );
  assert.match(output, /WARN · confidence 70%/);
  assert.match(output, /Hosted review is not available locally/);
  assert.match(output, /does not replace hosted CI/);
  assert.match(output, /human merge decision/);
});
