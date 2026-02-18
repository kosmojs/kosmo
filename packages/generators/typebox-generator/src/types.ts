import type { ValidationMessages } from "./templates/error-handler";

export type Options = {
  /**
   * Optional map of custom messages to override default validation messages.
   * Allows to customize error text for i18n/l10n or project-specific wording.
   *
   * Values are format strings compatible with `node:util.format`,
   * allowing placeholders like `%s` or `%d` to interpolate parameters.
   *
   * @example
   * validationMessages: {
   *    STRING_MIN_LENGTH: "must be at least %d character%s long",
   *    NUMBER_MULTIPLE_OF: "must be a multiple of %s",
   * }
   * */
  validationMessages?: Partial<ValidationMessages>;

  /**
   * Path to a file whose **default export** should be a map of type references.
   * These references are used to extend or complement TypeBox schemas.
   *
   * Each exported type should extend `Type.Base` (or another TypeBox type)
   * and be instantiated in the default export object.
   *
   * @example
   * import Type from "typebox";
   *
   * class TDate extends Type.Base<Date> {
   *   // ... implementation ...
   * }
   *
   * export default {
   *   Date: new TDate(),
   * };
   *
   * */
  customTypesImport?: string;

  /**
   * TypeBox settings
   * */
  settings?: Partial<{
    /**
     * Determines whether types should be instantiated as immutable using `Object.freeze(...)`.
     * This helps prevent unintended schema mutation. Enabling this option introduces a slight
     * performance overhead during instantiation.
     * @default false
     * */
    immutableTypes: boolean;

    /**
     * Specifies the maximum number of errors to buffer during diagnostics collection. TypeBox
     * performs exhaustive checks to gather diagnostics for invalid values, which can result in
     * excessive buffering for large or complex types. This setting limits the number of buffered
     * errors and acts as a safeguard against potential denial-of-service (DoS) attacks.
     * @default 8
     * */
    maxErrors: number;

    /**
     * Enables or disables the use of runtime code evaluation to accelerate validation. By default,
     * TypeBox checks for `unsafe-eval` support in the environment before attempting to evaluate
     * generated code. If evaluation is not permitted, it falls back to dynamic checking. Setting
     * this to `false` disables evaluation entirely, which may be desirable in applications that
     * restrict runtime code evaluation, regardless of Content Security Policy (CSP).
     * @default true
     * */
    useEval: boolean;

    /**
     * Enables or disables 'exactOptionalPropertyTypes' check semantics. By default, TypeScript
     * allows optional properties to be assigned 'undefined'. While this behavior differs from the
     * common interpretation of 'optional' as meaning 'key may be absent', TypeBox adopts the default
     * TypeScript semantics to remain consistent with the language. This option is provided to align
     * runtime check semantics with projects that configure 'exactOptionalPropertyTypes: true' in
     * tsconfig.json.
     * @default false
     * */
    exactOptionalPropertyTypes: boolean;

    /**
     * Controls whether internal compositor properties (`~kind`, `~readonly`, `~optional`) are enumerable.
     * @default false
     * */
    enumerableKind: boolean;
  }>;
};
