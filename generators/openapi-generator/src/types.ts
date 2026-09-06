export type JsonSchema = {
  type?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  anyOf?: JsonSchema[];
  const?: unknown;
  format?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  additionalProperties?: boolean | JsonSchema;
  [key: string]: unknown;
};

// OpenAPI Type Definitions
export type OpenAPIParameter =
  | {
      name: string;
      in: "path" | "query" | "header" | "cookie";
      required: boolean;
      schema: JsonSchema | { $ref: string };
    }
  | { $ref: string };

export type OpenAPIRequestBody = {
  required: boolean;
  content: Partial<
    Record<
      | "application/json"
      | "application/x-www-form-urlencoded"
      | "multipart/form-data"
      | "application/octet-stream",
      { schema: JsonSchema }
    >
  >;
};

export type OpenAPIResponse =
  | {
      description: string;
      content: Partial<
        Record<"application/json" | "text/plain", { schema: JsonSchema }>
      >;
    }
  | {
      description: string;
      headers: {
        Location: {
          description: string;
          schema: JsonSchema;
        };
      };
    };

export type OpenAPIOperation = {
  parameters?: Array<OpenAPIParameter>;
  responses: Record<string, OpenAPIResponse>;
  requestBody?: OpenAPIRequestBody;
};

export type OpenAPIPaths = {
  [path: string]: {
    [method: string]: OpenAPIOperation;
  };
};
