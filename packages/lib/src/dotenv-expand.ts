/**
 * Variable expansion for parsed env files - `$VAR`, `${VAR}`,
 * `${VAR:-default}`, `${VAR-default}`, `${VAR:+alt}`, `${VAR+alt}`, and `\$` for a literal dollar.
 *
 * A TypeScript port of dotenv-expand 13.0.0, the expansion Vite applies to env files.
 * Ported rather than depended on: dotenv-expand 1000+ runs `$(...)` through a shell
 * and decrypts dotenvx values during expansion, which Vite does not do.
 *
 * Differences from the original, none of them visible in the result:
 * - nothing is written to `processEnv` - a new record is returned instead;
 * - the input record is not mutated.
 *
 * ---
 *
 * Copyright (c) 2016, Scott Motte
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright notice, this
 *   list of conditions and the following disclaimer.
 *
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * */

type Env = Record<string, string | undefined>;

const resolveEscapeSequences = (value: string) => value.replace(/\\\$/g, "$");

const expandValue = (
  value: string,
  processEnv: Env,
  runningParsed: Record<string, string>,
) => {
  // process.env wins
  const env: Env = { ...runningParsed, ...processEnv };

  const regex = /(?<!\\)\${([^{}]+)}|(?<!\\)\$([A-Za-z_][A-Za-z0-9_]*)/g;

  let result = value;

  // self-referential checker
  const seen = new Set<string>();

  for (
    let match = regex.exec(result);
    match !== null;
    match = regex.exec(result)
  ) {
    seen.add(result);

    const [template, bracedExpression, unbracedExpression] = match;
    const expression = bracedExpression || unbracedExpression;

    // the first of the operators `:+`, `+`, `:-` and `-`
    const splitter = expression.match(/(:\+|\+|:-|-)/)?.[0];

    const parts = splitter ? expression.split(splitter) : [expression];
    const key = parts.shift() as string;

    let defaultValue: string;
    let found: string | undefined;

    if (splitter === ":+" || splitter === "+") {
      defaultValue = env[key] ? parts.join(splitter) : "";
      found = undefined;
    } else {
      defaultValue = parts.join(splitter ?? "");
      found = env[key];
    }

    if (found) {
      result = result.replace(template, seen.has(found) ? defaultValue : found);
    } else {
      result = result.replace(template, defaultValue);
    }

    // stop once the result equals what is already parsed for this key
    if (result === runningParsed[key]) {
      break;
    }

    // re-evaluate from the start after each replacement
    regex.lastIndex = 0;
  }

  return result;
};

/**
 * Expand references in `parsed`, in its key order, against `processEnv`.
 *
 * A key set in `processEnv` keeps that value instead of the file's.
 * A reference resolves against `processEnv`, then against keys expanded before it -
 * so, as in Vite, a key referenced before its own line has been expanded resolves empty.
 * */
export const expandEnv = (
  parsed: Record<string, string>,
  processEnv: Env,
): Record<string, string> => {
  const runningParsed: Record<string, string> = {};

  for (const [key, origin] of Object.entries(parsed)) {
    const preset = processEnv[key];

    const value =
      preset && preset !== origin
        ? preset
        : expandValue(origin, processEnv, runningParsed);

    runningParsed[key] = resolveEscapeSequences(value);
  }

  return runningParsed;
};
