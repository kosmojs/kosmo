import { styleText } from "node:util";

import type { Project } from "@kosmojs/cli";

const pickGreet = (greets: Array<string>) => {
  return styleText(
    ["bold", "green"],
    greets[Math.floor(Math.random() * greets.length)],
  );
};

const nextStepText = (text: string) => {
  return styleText(["bold", "italic", "cyan"], text);
};

const cmdText = (cmd: string, ...altCmds: Array<string>) => {
  const altText = altCmds.length
    ? styleText("dim", ` # or ${altCmds.map((e) => `\`${e}\``).join(" / ")}`)
    : "";
  return `$ ${styleText("blue", cmd)}${altText}`;
};

export const introText = () => {
  return pickGreet([
    "Great! Let's create a new KosmoJS project 🚀",
    "Right! It's perfect time for a new KosmoJS project ✨",
    "Nice! A fresh KosmoJS project coming right up 🛠️",
    "Awesome! Let's get a new KosmoJS project off the ground 🌟",
    "Splendid! Time to bootstrap a brand new KosmoJS project 💫",
  ]);
};

export const successText = () => {
  return pickGreet([
    "✨ Well Done! Your new KosmoJS app is ready",
    "💫 Excellent! Your new KosmoJS project is all set",
    "🌟 Nice work! Your KosmoJS setup is ready to perform",
    "🏆 Success! Your KosmoJS project is ready for exploration",
    "✅ All Set! Your KosmoJS project is ready to perform",
  ]);
};

export const nextStepsText = (project: Project) => {
  return [
    nextStepText("📦 Install Dependencies"),
    cmdText(`cd ./${project.name}`),
    cmdText("npm install", "pnpm install", "yarn install"),
    "",
    nextStepText("📁 Add a Source Folder"),
    cmdText("npm run +folder", "pnpm +folder", "yarn +folder"),
  ].join("\n");
};

export const docsText = () => "📘 Docs: https://kosmojs.dev";
