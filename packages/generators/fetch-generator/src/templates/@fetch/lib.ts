import { compile } from "path-to-regexp";

export const fetchClientFactory = <ParamsT extends Array<unknown>>(
  routeName: string,
  pathPattern: string,
  paramsMap: Array<[name: string, kind: string]>,
  numericParams: Array<string>,
) => {
  const toPath = compile(pathPattern);

  const paramsMapper = (params: ParamsT) => {
    return paramsMap.reduce<Record<string, unknown>>((map, [name, kind], i) => {
      if (kind === "splat") {
        if (Array.isArray(params[i]) && params[i].length) {
          map[name] = numericParams.includes(name)
            ? params[i].map(Number)
            : params[i].map(String);
        }
      } else if (params[i] !== undefined) {
        map[name] = numericParams.includes(name)
          ? Number(params[i])
          : String(params[i]);
      }
      return map;
    }, {});
  };

  return {
    paramsMapper,
    parametrize(params: ParamsT) {
      try {
        return toPath(paramsMapper(params) as never);
      } catch (error: any) {
        console.error(`❗ERROR: Failed building path for ${routeName}`);
        console.error(error);
        return "";
      }
    },
    resolvePayload(payload: unknown, target: string) {
      const data = payload?.[target as never] as unknown;
      if (!data) {
        return data;
      }
      if (data instanceof FormData) {
        const obj: Record<
          string,
          FormDataEntryValue | Array<FormDataEntryValue>
        > = {};
        for (const [key, value] of data.entries()) {
          if (key in obj) {
            obj[key] = [obj[key]].flat().concat(value);
          } else {
            obj[key] = value;
          }
        }
        return obj;
      }
      return data;
    },
  };
};
