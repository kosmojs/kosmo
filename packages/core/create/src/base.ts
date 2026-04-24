import { styleText } from "node:util";

import type { Project } from "@kosmojs/cli";

export const messageFactory = (logger?: (...lines: Array<unknown>) => void) => {
  const messageHandler = (lines: Array<unknown>) => {
    if (!logger) {
      return lines;
    }

    for (const line of lines) {
      logger(`  ${line}`);
    }

    return undefined;
  };

  const greetText = (greets: Array<string>) =>
    styleText(
      ["bold", "green"],
      greets[Math.floor(Math.random() * greets.length)],
    );

  const nextStepText = (text: string) => {
    return styleText(["bold", "italic", "cyan"], text);
  };

  const cmdText = (cmd: string, ...altCmds: Array<string>) => {
    const altText = altCmds.length
      ? styleText("dim", ` # or ${altCmds.map((e) => `\`${e}\``).join(" / ")}`)
      : "";
    return `$ ${styleText("blue", cmd)}${altText}`;
  };

  const docsText = () => "📘 Docs: https://kosmojs.dev";

  return {
    preamble() {
      return messageHandler([
        "",
        greetText(["Great! Let's create a new KosmoJS project 🚀"]),
        "",
      ]);
    },
    projectCreated(project: Project) {
      return messageHandler([
        "",
        greetText([
          "✨ Well Done! Your new KosmoJS app is ready",
          "💫 Excellent! Your new KosmoJS project is all set",
          "🌟 Nice work! Your KosmoJS setup is ready to perform",
          "🚀 Success! Your KosmoJS project is ready for exploration",
          "✅ All Set! Your KosmoJS project is configured and ready",
        ]),
        "",

        `${styleText(["bold", "yellow"], "➜ Next Steps")}`,
        "",

        nextStepText("📦 Install Dependencies"),
        cmdText(`cd ./${project.name}`),
        cmdText("npm install", "pnpm install", "yarn install"),
        "",

        nextStepText("📁 Add a Source Folder"),
        cmdText("npm run +folder", "pnpm +folder", "yarn +folder"),
        "",

        docsText(),
        "",
      ]);
    },
  };
};
