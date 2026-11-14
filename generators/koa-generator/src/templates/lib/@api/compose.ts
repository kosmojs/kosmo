/**
 * Adapted from koa-compose@4.2.0
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2013 TJ Holowaychuk tj@apex.sh
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * */

import type { RouterMiddleware } from "@koa/router";

export const compose = (
  middleware: Array<RouterMiddleware>,
): RouterMiddleware => {
  const funcs = middleware.flat();

  if (funcs.some((e) => typeof e !== "function")) {
    throw new TypeError("Middleware must be composed of functions!");
  }

  return async (ctx, next) => {
    const dispatch = async (i: number) => {
      const fn = i === funcs.length ? next : funcs[i];

      if (!fn) {
        return;
      }

      let nextCalled = false;
      let nextResolved = false;

      const nextProxy = async () => {
        if (nextCalled) {
          throw Error("next() called multiple times");
        }

        nextCalled = true;

        try {
          return await dispatch(i + 1);
        } finally {
          nextResolved = true;
        }
      };

      const result = await fn(ctx, nextProxy);

      if (nextCalled && !nextResolved) {
        throw Error(
          "Middleware resolved before downstream.\n\tYou are probably missing an await or return",
        );
      }

      return result;
    };

    return dispatch(0);
  };
};
