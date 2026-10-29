import { HttpResponse, http } from "msw";
import { describe, expect, test } from "vitest";

import fetchWrapper, { type HTTPError, type HTTPMethod } from "#/fetch/index";

import { server } from "./mocks";

describe("fetch", () => {
  const fetch = fetchWrapper({ prefix: "http://json" });

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
        expect(res.params).toEqual({ path: "a/b/c" });
      });

      test(`${method}: with string params`, async () => {
        const res = await fetch[method]<ResponseT>(["a/b/c"]);
        expect(res.params).toEqual({ path: "a/b/c" });
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
    const fetch = fetchWrapper({ prefix: "http://text" });
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
    const fetch = fetchWrapper({
      prefix: "http://buffer",
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
    const fetch = fetchWrapper({ prefix: "http://blob", responseMode: "blob" });
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

  describe("form: URL-encoded", () => {
    const fetch = fetchWrapper({ prefix: "http://form" });
    const name = "John";
    for (const method of ["POST", "PUT", "PATCH"] as const) {
      test(method, async () => {
        const res = await fetch[method]<ResponseT>([], { form: { name } });
        expect(res.body).toEqual({ name });
      });
    }
  });

  describe("form: Multipart", () => {
    const fetch = fetchWrapper({ prefix: "http://multipart" });
    const name = "John";
    for (const method of ["POST", "PUT", "PATCH"] as const) {
      const form = new FormData();
      form.set("name", name);
      test(method, async () => {
        const res = await fetch[method]<FormData>(
          [],
          { form },
          { responseMode: "formData" },
        );
        expect(res.get("name")).toEqual(name);
      });
    }
  });

  describe("raw response", () => {
    const fetch = fetchWrapper({ prefix: "http://raw", responseMode: "raw" });
    for (const method of ["POST", "PUT", "PATCH"] as const) {
      test(method, async () => {
        const res = await fetch[method]<Response>([]);
        expect(res).toBeInstanceOf(Response);
        expect(await res.text()).toEqual("raw");
      });
    }
  });

  // no responseMode given: the parser is picked from the response Content-Type
  describe("automatic response mode", () => {
    test("HttpResponse.json gives an object", async () => {
      const fetch = fetchWrapper({ prefix: "http://json" });
      const res = await fetch.GET<ResponseT>();
      expect(res).toBeTypeOf("object");
      expect(res.method).toEqual("GET");
    });

    test("HttpResponse.text gives a string", async () => {
      const fetch = fetchWrapper({ prefix: "http://text" });
      const res = await fetch.POST<string>([], { raw: "payload" });
      expect(res).toEqual("payload");
    });

    test("HttpResponse.formData gives a FormData", async () => {
      const fetch = fetchWrapper({ prefix: "http://multipart" });
      const form = new FormData();
      form.set("name", "John");
      const res = await fetch.POST<FormData>([], { form });
      expect(res).toBeInstanceOf(FormData);
      expect(res.get("name")).toEqual("John");
    });

    test("no Content-Type gives a Blob", async () => {
      // a string body would get text/plain from the Response constructor,
      // bytes get no Content-Type at all
      server.use(
        http.get("http://bytes/", () => {
          return new HttpResponse(new TextEncoder().encode("bytes"));
        }),
      );
      const fetch = fetchWrapper({ prefix: "http://bytes" });
      const res = await fetch.GET<Blob>();
      expect(res).toBeInstanceOf(Blob);
      expect(await res.text()).toEqual("bytes");
    });
  });

  describe("bodyless statuses", () => {
    test("204 resolves to undefined", async () => {
      server.use(
        http.delete("http://empty/", () => {
          return new HttpResponse(null, { status: 204 });
        }),
      );
      const fetch = fetchWrapper({ prefix: "http://empty" });
      expect(await fetch.DELETE()).toBeUndefined();
    });

    test('204 with responseMode: "raw" resolves to the Response', async () => {
      server.use(
        http.delete("http://empty/", () => {
          return new HttpResponse(null, { status: 204 });
        }),
      );
      const fetch = fetchWrapper({ prefix: "http://empty" });
      const res = await fetch.DELETE<Response>([], {}, { responseMode: "raw" });
      expect(res).toBeInstanceOf(Response);
      expect(res.status).toEqual(204);
    });
  });

  describe("error responses", () => {
    test("4xx with a text/plain body gives error.body as a string", async () => {
      server.use(
        http.get("http://failing/", () => {
          return HttpResponse.text("not found here", { status: 404 });
        }),
      );
      const fetch = fetchWrapper({ prefix: "http://failing" });
      const error = (await fetch.GET().catch((e) => e)) as HTTPError;
      expect(error).toBeInstanceOf(Error);
      expect(error.response.status).toEqual(404);
      expect(error.body).toEqual("not found here");
    });
  });
});
