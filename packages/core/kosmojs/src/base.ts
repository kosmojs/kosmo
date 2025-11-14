import { access, constants, cp } from "node:fs/promises";
import { basename } from "node:path";
import { styleText } from "node:util";

export type Project = { name: string; distDir?: string };

export type SourceFolder = {
  name: string;
  framework?: (typeof FRAMEWORK_OPTIONS)[number];
  ssr?: boolean;
  base?: string;
  port?: number | string;
};

export const CREATE_OPTIONS = ["project", "folder"] as const;

export const FRAMEWORK_OPTIONS = [
  "none",
  "solid",
  "react",
  // TODO: implement vue/svelte generators
  // "vue",
  // "svelte",
] as const;

export const NODE_VERSION = "22";
export const DEFAULT_DIST = "dist";
export const DEFAULT_BASE = "/";
export const DEFAULT_PORT = "4000";
export const DEFAULT_FRAMEWORK = "none" as const;

export const copyFiles = async (
  src: string,
  dst: string,
  { exclude = [] }: { exclude?: Array<string | RegExp> } = {},
): Promise<void> => {
  const filter = exclude.length
    ? (path: string) => {
        return !exclude.some((e) => {
          return typeof e === "string" ? e === basename(path) : e.test(path);
        });
      }
    : undefined;

  await cp(src, dst, {
    recursive: true,
    force: true,
    filter,
  });
};

export const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

export const validateName = (name: string | undefined) => {
  if (!name) {
    return "Invalid name provided";
  }
  if (/[^\w.@$+-]/.test(name)) {
    return "May contain only alphanumerics, hyphens, periods or any of @ $ +";
  }
  return undefined;
};

export const validateBase = (base: string | undefined) => {
  if (!base?.startsWith("/")) {
    return "Should start with a slash";
  }
  if (
    [
      // path traversal patterns
      /\.\.\//,
      /\/\.\//,
    ].some((e) => e.test(base.trim()))
  ) {
    return "Should not contain path traversal patterns";
  }
  return undefined;
};

export const validatePort = (port: string | number | undefined) => {
  if (!port || /[^\d]/.test(String(port).trim())) {
    return "Invalid port number";
  }
  return undefined;
};

export const assertNoError = (validator: () => string | undefined) => {
  const error = validator();
  if (error) {
    throw new Error(error);
  }
};

export const messageFactory = (logger?: (...lines: Array<unknown>) => void) => {
  const projectCreatedGreets = [
    "✨ Well Done! Your new KosmoJS app is ready",
    "💫 Excellent! Your new KosmoJS project is all set",
    "🌟 Nice work! Your KosmoJS setup is ready to perform",
    "🚀 Success! Your KosmoJS project is ready for exploration",
    "✅ All Set! Your KosmoJS project is configured and ready",
  ];

  const sourceFolderCreatedGreets = [
    "💫 Awesome! You just created a new Source Folder",
    "✨ Nice! Your new Source Folder is ready to use",
    "🎯 Perfect! Source Folder created successfully",
    "✅ Great! Your Source Folder is all set up",
    "🌟 Excellent! New Source Folder is ready to perform",
  ];

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
    projectCreated(project: Project) {
      return messageHandler([
        "",
        greetText(projectCreatedGreets),
        "",

        `${styleText(["bold", "yellow"], "➜ Next Steps")}`,
        "",

        nextStepText("📦 Install Dependencies"),
        cmdText(`cd ./${project.name}`),
        cmdText("pnpm install", "npm install", "yarn install"),
        "",

        nextStepText("📁 Add a Source Folder"),
        cmdText("pnpm +folder", "npm run +folder", "yarn +folder"),
        "",

        docsText(),
        "",
      ]);
    },

    sourceFolderCreated(_folder: SourceFolder) {
      return messageHandler([
        "",
        greetText(sourceFolderCreatedGreets),
        "",

        nextStepText(
          "📦 Now install any new dependencies that may have been added",
        ),
        cmdText("pnpm install", "npm install", "yarn install"),
        "",

        nextStepText(
          "🚀 Once dependencies are installed, start the dev server",
        ),
        cmdText("pnpm dev", "npm run dev", "yarn dev"),
        "",

        docsText(),
        "",
      ]);
    },
  };
};
