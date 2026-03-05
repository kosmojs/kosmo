import { defineRoute } from "@test/index";

type DocumentResponse = {
  id: string;
  title: string;
  content: string;
  ownerId: number;
  createdAt: TRefine<string, { format: "date-time" }>;
  updatedAt: TRefine<string, { format: "date-time" }>;
};

type UpdateDocumentPayload = {
  title?: TRefine<string, { minLength: 1; maxLength: 255 }>;
  content?: string;
};

type DocumentQuery = {
  includeVersions?: boolean;
  includeMetadata?: boolean;
  format?: "full" | "minimal";
};

export default defineRoute<[TRefine<string, { format: "uuid" }>]>(
  ({ GET, PUT, DELETE }) => [
    GET<{ json: DocumentQuery; response: [200, "json", DocumentResponse] }>(
      async (ctx) => {
        ctx.body = {
          id: ctx.params.uuid,
          title: "Sample Document",
          content: "This is the document content",
          ownerId: 123,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };
      },
    ),

    PUT<{
      json: UpdateDocumentPayload;
      response: [200, "json", DocumentResponse];
    }>(async (ctx) => {
      const { title, content } = ctx.validated.json;
      ctx.body = {
        id: ctx.params.uuid,
        title: title || "Updated Document",
        content: content || "Updated content",
        ownerId: 123,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: new Date().toISOString(),
      };
    }),

    DELETE<{ response: [200, "json", { success: boolean; message: string }] }>(
      async (ctx) => {
        ctx.body = { success: true, message: "Document deleted" };
      },
    ),
  ],
);
