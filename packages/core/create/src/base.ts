import { access, constants, cp } from "node:fs/promises";
import { basename } from "node:path";
import type { parseArgs } from "node:util";
import { styleText } from "node:util";

export type Project = { name: string; distDir?: string };

export type SourceFolder = {
  name: string;
  framework?: (typeof FRAMEWORK_OPTIONS)[number];
  ssr?: boolean;
  baseurl?: string;
  port?: number;
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

export const CLI_OPTIONS = {
  create: { type: "string", short: "c" },
  name: { type: "string", short: "n" },
  dist: { type: "string", short: "d" },
  framework: { type: "string", short: "f" },
  ssr: { type: "string", short: "s" },
  baseurl: { type: "string", short: "b" },
  port: { type: "string", short: "p" },
  quiet: { type: "boolean", short: "q" },
  help: { type: "boolean", short: "h" },
} as const;

export type CLIOptions = ReturnType<
  typeof parseArgs<{ options: typeof CLI_OPTIONS }>
>;

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

export const validateOptions = (options: CLIOptions) => {
  const validValues = {
    create: CREATE_OPTIONS,
    framework: FRAMEWORK_OPTIONS,
    ssr: [true, false],
    quiet: [true],
    help: [true],
  } as const;

  return (option: keyof typeof CLI_OPTIONS) => {
    const value = options.values[option];

    if (option === "name") {
      return validateName(value as never);
    } else if (option === "baseurl") {
      return validateBaseurl(value as never);
    } else if (option === "port") {
      return validatePortNumber(value as never);
    } else if (option === "dist") {
      return validatePath(value as never);
    }

    if (!validValues[option]?.includes(value as never)) {
      const error = [`Invalid --${option} value "${value}"`];

      if (option in validValues) {
        error.push(
          `Options: ${validValues[option].map((v) => styleText("cyan", String(v))).join(", ")}`,
        );
      }

      return error.join("\n");
    }
    return undefined;
  };
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

export const validatePath = (path: string | undefined) => {
  if (!path?.trim()) {
    return "Invalid path provided";
  }
  if (/[^\w./-]/.test(path)) {
    return "May contain only alphanumerics, hyphens, periods or slashes";
  }
  if (
    [
      // path traversal patterns
      /\.\.\//,
      /\/\.\//,
      /^\//,
    ].some((e) => e.test(path.trim()))
  ) {
    return "Should not contain path traversal patterns";
  }
  return undefined;
};

export const validateBaseurl = (baseurl: string | undefined) => {
  if (!baseurl?.startsWith("/")) {
    return "Should start with a slash";
  }
  if (
    [
      // path traversal patterns
      /\.\.\//,
      /\/\.\//,
    ].some((e) => e.test(baseurl.trim()))
  ) {
    return "Should not contain path traversal patterns";
  }
  return undefined;
};

export const validatePortNumber = (port: string | number | undefined) => {
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
    "🌟 Nice work! Your KosmoJS setup is good to go",
    "🚀 Success! Your KosmoJS project is ready for exploration",
    "✅ All Set! Your KosmoJS project is configured and ready",
  ];

  const sourceFolderCreatedGreets = [
    "💫 Awesome! You just created a new Source Folder",
    "✨ Nice! Your new Source Folder is ready to use",
    "🎯 Perfect! Source Folder created successfully",
    "⚡ Great! Your Source Folder is all set up",
    "🌟 Excellent! New Source Folder is good to go",
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

  return {
    projectCreated(project: Project) {
      return messageHandler([
        "",
        styleText(
          ["bold", "green"],
          projectCreatedGreets[
            Math.floor(Math.random() * projectCreatedGreets.length)
          ],
        ),
        "",

        `${styleText(["bold", "italic", "yellow"], "📁 Perfect time to add a Source Folder")}`,
        "",
        `➜ Navigate to your app dir and run ${styleText("blue", "npx kosmojs")} again:`,
        `$ ${styleText("blue", `cd ./${project.name}`)}`,
        `$ ${styleText("blue", "npx kosmojs")}`,
        "",

        "📘 Docs: https://kosmojs.dev",
        "",
      ]);
    },

    sourceFolderCreated(_folder: SourceFolder) {
      return messageHandler([
        "",
        styleText(
          ["bold", "green"],
          sourceFolderCreatedGreets[
            Math.floor(Math.random() * sourceFolderCreatedGreets.length)
          ],
        ),
        "",

        "Now install any new dependencies that may have been added:",
        `$ ${styleText("blue", "pnpm install")} ${styleText(["gray"], "# or npm install / yarn install")}`,
        "",

        "🚀 Once dependencies are installed, start the dev server:",
        `$ ${styleText("blue", "pnpm dev")} ${styleText(["gray"], "# or npm run dev / yarn dev")}`,
        "",

        "📘 Docs: https://kosmojs.dev",
        "",
      ]);
    },
  };
};
