import { test } from "vitest";

import { type HTTPMethod, RequestBodyTargets } from "@kosmojs/api";

import { importFetchClient, serializeFormData, typedEntries } from ".";
import type { RouteName } from "./@fixtures/routes";
import { type PayloadMap, type PayloadVariant, payloadMap } from "./payloads";

for (const [route, payloads] of typedEntries(payloadMap)) {
  const fetchClient = await importFetchClient(route);

  const entries = typedEntries(payloads);

  const [paramsVariants = [[]]] = entries.flatMap(([key, val]) => {
    return key === "params" ? [val] : [];
  }) as [PayloadMap[RouteName]["params"]];

  const payloadsVariants = entries.flatMap(([key, val]) => {
    return key === "params" ? [] : [[key, val]];
  }) as Array<[HTTPMethod, Array<PayloadVariant>]>;

  for (const paramsVariant of paramsVariants) {
    for (const [method, payloads] of payloadsVariants) {
      test(
        `${route} ${method} ${paramsVariant.join(" ")}`.trim(),
        async ({ expect }) => {
          for (const variant of payloads) {
            const xMockTarget = Object.keys(variant).find((e) => {
              return Object.keys(RequestBodyTargets).includes(e);
            });

            const xMockPayload = variant[xMockTarget as never];

            const xMockType = Buffer.isBuffer(xMockPayload)
              ? "Buffer"
              : Object.prototype.toString.call(xMockPayload);

            const { headers, params, searchParams, json, form, raw } =
              await fetchClient[method](paramsVariant as never, {
                ...variant,
                headers: {
                  ...variant.headers,
                  "x-mock-target": xMockTarget,
                  "x-mock-type": xMockType,
                },
              });

            expect(paramsVariant).toEqual(Object.values(params));

            if (variant.headers) {
              for (const [key, val] of Object.entries(variant.headers)) {
                expect(val, JSON.stringify({ key, val, headers })).toEqual(
                  headers[key],
                );
              }
            }

            if (variant.query) {
              expect(variant.query).toEqual(searchParams);
            }

            if (variant.json) {
              expect(variant.json).toEqual(json);
            }

            if (variant.form) {
              if (variant.form instanceof FormData) {
                expect(form).toEqual(await serializeFormData(variant.form));
              } else {
                expect(form).toEqual(variant.form);
              }
            }

            if (variant.raw) {
              if (xMockType === "Buffer") {
                expect(raw).toEqual(
                  Buffer.from(variant.raw as never).toString(),
                );
              } else if (xMockType === "[object String]") {
                expect(raw).toEqual(variant.raw);
              }
            }
          }
        },
      );
    }
  }
}
