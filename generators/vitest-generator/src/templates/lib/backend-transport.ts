import backendApp from "virtual:kosmo/backend-app";

import type { Transport } from "@kosmojs/core/fetch";
import { createDispatch } from "@kosmojs/core/fetch/transport";

import { currentHeaders } from "./backend-context";

import { name as sourceFolderName } from "{{ createImport 'libCore' }}";

// Requests never leave the process, so the origin is only there to make URLs absolute.
const origin = "http://kosmo.test";

const dispatch = backendApp ? createDispatch(backendApp) : undefined;

const transport: Transport = {
  async requestHandler(input, init) {
    if (!dispatch) {
      throw new Error(
        `${sourceFolderName} source folder has no backend enabled, no app to dispatch into.`,
      );
    }

    const headers = new Headers(init?.headers);

    // scoped headers are defaults: anything set on the call itself wins
    for (const [name, value] of currentHeaders()) {
      if (!headers.has(name)) {
        headers.set(name, value);
      }
    }

    return dispatch(
      input instanceof Request
        ? new Request(input, { headers })
        : new Request(new URL(String(input), origin), { ...init, headers }),
    );
  },
  async responseHandler({ body, response }) {
    return { body, response };
  },
};

export default transport;
