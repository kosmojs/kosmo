import { describe, expect, test } from "vitest";

import fetchWrapper, { type HTTPMethod } from "@src/index";

describe("fetch", () => {
  const fetch = fetchWrapper("http://json");

  type ResponseT = {
    method: HTTPMethod;
    url: string;
    headers: Record<string, unknown>;
    path: string;
    params: Record<string, string>;
    searchParams: Record<string, string>;
    body?: Record<string, unknown>;
  };

  describe("params", () => {
    for (const method of ["GET", "DELETE", "POST", "PUT", "PATCH"] as const) {
      test(`${method}: no params`, async () => {
        const res = await fetch[method]<ResponseT>();
        expect(res.params).toEqual({});
      });

      test(`${method}: with array params`, async () => {
        const res = await fetch[method]<ResponseT>(["a", "b", "c"]);
        expect(res.params).toEqual({ path: ["a", "b", "c"] });
      });

      test(`${method}: with string params`, async () => {
        const res = await fetch[method]<ResponseT>(["a/b/c"]);
        expect(res.params).toEqual({ path: ["a", "b", "c"] });
      });
    }
  });

  describe("query string", () => {
    for (const method of ["GET", "DELETE"] as const) {
      test(method, async () => {
        const res = await fetch[method]<ResponseT>([], { query: { id: 10 } });
        expect(res.searchParams).toEqual({ id: "10" });
        expect(res.body).toBeUndefined();
      });
    }
  });

  describe("json data", () => {
    for (const method of ["POST", "PUT", "PATCH"] as const) {
      test(method, async () => {
        const res = await fetch[method]<ResponseT>([], { json: { id: 10 } });
        expect(res.searchParams).toEqual({});
        expect(res.body).toEqual({ id: 10 });
      });
    }
  });

  describe("raw:text", () => {
    const fetch = fetchWrapper("http://text");
    for (const method of ["POST", "PUT", "PATCH"] as const) {
      test(method, async () => {
        const res = await fetch[method]<string>(
          [],
          { raw: "payload" },
          { responseMode: "text" },
        );
        expect(res).toEqual("payload");
      });
    }
  });

  describe("raw:buffer", () => {
    const fetch = fetchWrapper("http://buffer", {
      responseMode: "arrayBuffer",
    });
    const name = "John";
    for (const method of ["POST", "PUT", "PATCH"] as const) {
      const data = new TextEncoder().encode(name).buffer;
      test(method, async () => {
        const res = await fetch[method]<ArrayBuffer>([], { raw: data });
        expect(Buffer.from(data).toString()).toEqual(
          Buffer.from(res).toString(),
        );
      });
    }
  });

  describe("raw:blob", () => {
    const fetch = fetchWrapper("http://blob", {
      responseMode: "blob",
    });
    for (const method of ["POST", "PUT", "PATCH"] as const) {
      const blob = new Blob(["payload"]);
      test(method, async () => {
        const res = await fetch[method]<Blob>([], {
          raw: blob,
          headers: { "Content-Type": "text/plain" },
        });
        expect(res.type).toEqual("text/plain");
        expect(await res.text()).toEqual("payload");
      });
    }
  });

  describe("form", () => {
    const fetch = fetchWrapper("http://form");
    const name = "John";
    for (const method of ["POST", "PUT", "PATCH"] as const) {
      test(method, async () => {
        const res = await fetch[method]<ResponseT>([], { form: { name } });
        expect(res.body).toEqual({ name });
      });
    }
  });

  describe("multipart", () => {
    const fetch = fetchWrapper("http://multipart");
    const name = "John";
    for (const method of ["POST", "PUT", "PATCH"] as const) {
      const formData = new FormData();
      formData.set("name", name);
      test(method, async () => {
        const res = await fetch[method]<FormData>(
          [],
          { multipart: formData },
          { responseMode: "formData" },
        );
        expect(res.get("name")).toEqual(name);
      });
    }
  });

  describe("raw response", () => {
    const fetch = fetchWrapper("http://raw", { responseMode: "raw" });
    for (const method of ["POST", "PUT", "PATCH"] as const) {
      test(method, async () => {
        const res = await fetch[method]<Response>([]);
        expect(res).toBeInstanceOf(Response);
        expect(await res.text()).toEqual("raw");
      });
    }
  });
});
