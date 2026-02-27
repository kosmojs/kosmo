import { type HttpHandler, HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { parse } from "qs";

import { type ResponseT, serializeFormData, typedEntries } from ".";
import { payloadMap } from "./payloads";

const BASE = "http://localhost:3000/api";

export const handlers: Array<HttpHandler> = typedEntries(payloadMap).flatMap(
  ([route, payloads]) => {
    const mswPath = route
      .replace(/\{\.\.\.([^}]+)\}/g, ":$1*")
      .replace(/\{:([^}]+)\}/g, ":$1?");

    return typedEntries(payloads).flatMap((entry) => {
      if (entry[0] === "params") {
        return [];
      }

      const method = entry[0];
      const verb = method.toLowerCase() as keyof typeof http;

      return http[verb](`${BASE}/${mswPath}`, async ({ request, params }) => {
        const { url } = request;
        const headers = Object.fromEntries(request.headers.entries());
        return HttpResponse.json({
          url,
          method,
          headers,
          params,
          searchParams: parse(url.split("?")[1]),
          ...(["POST", "PUT", "PATCH"].includes(method)
            ? {
                ...(headers["x-mock-target"] === "json"
                  ? { json: (await request.json()) as never }
                  : {}),
                ...(headers["x-mock-target"] === "form"
                  ? { form: parse(await request.text()) }
                  : {}),
                ...(headers["x-mock-target"] === "multipart"
                  ? {
                      multipart: await serializeFormData(
                        await request.formData(),
                      ),
                    }
                  : {}),
                ...(headers["x-mock-target"] === "raw"
                  ? {
                      raw:
                        headers["x-mock-type"] === "Buffer"
                          ? Buffer.from(await request.arrayBuffer()).toString()
                          : headers["x-mock-type"] === "[object String]"
                            ? await request.text()
                            : undefined,
                    }
                  : {}),
              }
            : {}),
        } satisfies ResponseT);
      });
    });
  },
);

export const server = setupServer(...handlers);
