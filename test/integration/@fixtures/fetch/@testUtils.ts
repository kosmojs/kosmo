import { lookup } from "mrmime";

type FormDataFactoryFile =
  | string
  | { name: string; type?: string; blob?: Blob };

export const formDataFactory = (
  fields: Record<string, string>,
  files?: Record<string, FormDataFactoryFile | Array<FormDataFactoryFile>>,
) => {
  const formData = new FormData();
  for (const [key, val] of Object.entries(fields)) {
    formData.append(key, val);
  }
  for (const [key, value] of Object.entries(files || {})) {
    for (const file of [value].flat()) {
      const [name, type, blob] =
        typeof file === "string" ? [file] : [file.name, file.type, file.blob];
      formData.append(
        key,
        blob
          ? blob
          : new Blob([name], {
              type: type
                ? lookup(type) || type
                : lookup(name) || "text/plain",
            }),
        name,
      );
    }
  }
  return formData;
};
