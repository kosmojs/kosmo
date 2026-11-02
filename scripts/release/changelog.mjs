import { writeFileSync } from "node:fs";

import { ConventionalChangelog } from "conventional-changelog";
import createPreset from "conventional-changelog-conventionalcommits";

const file = "CHANGELOG.md";

const preset = createPreset({
  types: [
    { type: "feat", section: "Features" },
    { type: "fix", section: "Bug Fixes" },
    { type: "perf", section: "Performance Improvements" },
    { type: "revert", section: "Reverts" },
    { type: "refactor", section: "Code Refactoring" },
    { type: "refine", section: "Improvements" },
    { type: "misc", section: "Miscellaneous" },
  ],
});

// the preset's own line for the commit, followed by the commit body, when any
const commitPartial = (context, commit) => {
  const line = preset.writer.commitPartial(context, commit);
  const body = commit.body?.trim();
  return body ? `${line}\n\n${body}` : line;
};

const generator = new ConventionalChangelog()
  .readPackage("packages/core/package.json")
  .config(preset)
  .writer({ commitPartial })
  .options({
    releaseCount: 0,
    outputUnreleased: true,
  });

let release = "";

for await (const chunk of generator.write()) {
  release += chunk;
}

writeFileSync(file, release);
