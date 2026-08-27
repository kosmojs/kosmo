import { Spinner } from "@topcli/spinner";

export type SpinnerFactory = {
  text: (text: string) => void;
  append: (text: string) => void;
  succeed: (text?: string) => void;
  failed: (text?: string) => void;
};

export const spinnerFactory = (startText: string): SpinnerFactory => {
  if (!process.stdout.isTTY || process.env.CI || process.env.TERM === "dumb") {
    // stub for non-TTY / CI runners
    return {
      text() {},
      append() {},
      succeed() {},
      failed() {},
    };
  }

  const spinner = new Spinner().start(startText);

  let _text = startText;

  return {
    text(text) {
      _text = text;
      spinner.text = text;
    },
    append(text) {
      spinner.text = `${_text} › ${text}`;
    },
    succeed(text) {
      if (text) {
        this.append(text);
      } else {
        this.text(_text);
      }
      spinner.succeed();
    },
    failed(text) {
      if (text) {
        this.text([_text, text].join("\n"));
      }
      spinner.failed();
    },
  };
};
