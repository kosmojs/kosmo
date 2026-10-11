import { writeFileSync } from "node:fs";
import { ConventionalChangelog } from "conventional-changelog";

const file = "CHANGELOG.md";

const generator = new ConventionalChangelog()
  .readPackage("packages/core/package.json")
  .loadPreset({
    name: "conventionalcommits",
    types: [
      { type: "feat", section: "Features" },
      { type: "fix", section: "Bug Fixes" },
      { type: "perf", section: "Performance Improvements" },
      { type: "revert", section: "Reverts" },
      { type: "refactor", section: "Code Refactoring" },
    ],
  })
  .options({
    releaseCount: 0,
    outputUnreleased: true,
  });

let release = "";

for await (const chunk of generator.write()) {
  release += chunk;
}

writeFileSync(file, release);
