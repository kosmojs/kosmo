export type TypeboxSettings = Partial<{
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

/**
 * Message codes for i18n/l10n support
 * */
export enum TYPEBOX_MESSAGE_CODES {
  // Generic messages

  /** Singular form of "property" word for i18n */
  PROPERTY = "PROPERTY",
  /** Plural form of "properties" word for i18n */
  PROPERTIES = "PROPERTIES",

  /** Text for "allowed values" phrase for i18n */
  ALLOWED_VALUES = "ALLOWED_VALUES",
  /** Message template for displaying count of duplicate items found */
  FOUND_N_DUPLICATES = "FOUND_N_DUPLICATES",

  /** Message displayed when validation succeeds */
  VALIDATION_PASSED = "VALIDATION_PASSED",
  /** Prefix text for validation error messages (e.g., "Validation failed:") */
  VALIDATION_FAILED_PREFIX = "VALIDATION_FAILED_PREFIX",

  /** Template for error summary showing error count and affected fields */
  ERROR_SUMMARY = "ERROR_SUMMARY",
  /** Plural suffix for words (e.g., "s" in English) */
  PLURAL_SUFFIX = "PLURAL_SUFFIX",

  /** Ordinal position label for first element in tuple/array */
  FIRST = "FIRST",
  /** Ordinal position label for second element in tuple/array */
  SECOND = "SECOND",
  /** Ordinal position label for third element in tuple/array */
  THIRD = "THIRD",
  /** Ordinal position label for fourth element in tuple/array */
  FOURTH = "FOURTH",
  /** Ordinal position label for fifth element in tuple/array */
  FIFTH = "FIFTH",

  // Error messages

  // Type validation
  /** Invalid data type - expected a specific type */
  TYPE_INVALID = "TYPE_INVALID",

  // String validation
  /** String is too short - minimum length constraint violated */
  STRING_MIN_LENGTH = "STRING_MIN_LENGTH",
  /** String is too long - maximum length constraint violated */
  STRING_MAX_LENGTH = "STRING_MAX_LENGTH",
  /** String doesn't match required pattern/regex */
  STRING_PATTERN = "STRING_PATTERN",
  /** String doesn't match required format (generic) */
  STRING_FORMAT = "STRING_FORMAT",
  /** Invalid email address format */
  STRING_FORMAT_EMAIL = "STRING_FORMAT_EMAIL",
  /** Invalid date format */
  STRING_FORMAT_DATE = "STRING_FORMAT_DATE",
  /** Invalid date-time format */
  STRING_FORMAT_DATETIME = "STRING_FORMAT_DATETIME",
  /** Invalid time format */
  STRING_FORMAT_TIME = "STRING_FORMAT_TIME",
  /** Invalid URI format */
  STRING_FORMAT_URI = "STRING_FORMAT_URI",
  /** Invalid URL format */
  STRING_FORMAT_URL = "STRING_FORMAT_URL",
  /** Invalid UUID format */
  STRING_FORMAT_UUID = "STRING_FORMAT_UUID",
  /** Invalid IPv4 address format */
  STRING_FORMAT_IPV4 = "STRING_FORMAT_IPV4",
  /** Invalid IPv6 address format */
  STRING_FORMAT_IPV6 = "STRING_FORMAT_IPV6",
  /** Invalid hostname format */
  STRING_FORMAT_HOSTNAME = "STRING_FORMAT_HOSTNAME",
  /** Invalid JSON pointer format */
  STRING_FORMAT_JSON_POINTER = "STRING_FORMAT_JSON_POINTER",
  /** Invalid regular expression format */
  STRING_FORMAT_REGEX = "STRING_FORMAT_REGEX",

  // Number validation
  /** Number is below minimum value */
  NUMBER_MINIMUM = "NUMBER_MINIMUM",
  /** Number exceeds maximum value */
  NUMBER_MAXIMUM = "NUMBER_MAXIMUM",
  /** Number is below exclusive minimum value */
  NUMBER_EXCLUSIVE_MINIMUM = "NUMBER_EXCLUSIVE_MINIMUM",
  /** Number exceeds exclusive maximum value */
  NUMBER_EXCLUSIVE_MAXIMUM = "NUMBER_EXCLUSIVE_MAXIMUM",
  /** Number is not a multiple of required value */
  NUMBER_MULTIPLE_OF = "NUMBER_MULTIPLE_OF",

  // Array validation
  /** Array has too few items - minimum items constraint violated */
  ARRAY_MIN_ITEMS = "ARRAY_MIN_ITEMS",
  /** Array has too many items - maximum items constraint violated */
  ARRAY_MAX_ITEMS = "ARRAY_MAX_ITEMS",
  /** Array contains duplicate items when uniqueness is required */
  ARRAY_UNIQUE_ITEMS = "ARRAY_UNIQUE_ITEMS",
  /** Array doesn't contain required valid items */
  ARRAY_CONTAINS = "ARRAY_CONTAINS",
  /** Array contains too few items matching criteria */
  ARRAY_MIN_CONTAINS = "ARRAY_MIN_CONTAINS",
  /** Array contains too many items matching criteria */
  ARRAY_MAX_CONTAINS = "ARRAY_MAX_CONTAINS",
  /** Invalid tuple structure */
  ARRAY_PREFIX_ITEMS = "ARRAY_PREFIX_ITEMS",
  /** Invalid additional items beyond tuple definition */
  ARRAY_ITEMS = "ARRAY_ITEMS",
  /** Invalid unevaluated items in array */
  ARRAY_UNEVALUATED_ITEMS = "ARRAY_UNEVALUATED_ITEMS",

  // Tuple-specific validation
  /** Tuple has too few elements */
  TUPLE_MIN_ITEMS = "TUPLE_MIN_ITEMS",
  /** Tuple has too many elements */
  TUPLE_MAX_ITEMS = "TUPLE_MAX_ITEMS",

  // Object validation
  /** Missing required property/properties */
  OBJECT_REQUIRED = "OBJECT_REQUIRED",
  /** Object contains additional properties not allowed by schema */
  OBJECT_ADDITIONAL_PROPERTIES = "OBJECT_ADDITIONAL_PROPERTIES",
  /** Object has too few properties */
  OBJECT_MIN_PROPERTIES = "OBJECT_MIN_PROPERTIES",
  /** Object has too many properties */
  OBJECT_MAX_PROPERTIES = "OBJECT_MAX_PROPERTIES",
  /** Invalid property name */
  OBJECT_PROPERTY_NAMES = "OBJECT_PROPERTY_NAMES",
  /** Missing dependent required properties */
  OBJECT_DEPENDENCIES = "OBJECT_DEPENDENCIES",
  /** Object contains unevaluated properties */
  OBJECT_UNEVALUATED_PROPERTIES = "OBJECT_UNEVALUATED_PROPERTIES",

  // Enum and const validation
  /** Value is not one of the allowed enum values */
  ENUM_MISMATCH = "ENUM_MISMATCH",
  /** Value doesn't match the required constant value */
  CONST_MISMATCH = "CONST_MISMATCH",

  // Conditional schema validation
  /** Doesn't match conditional if schema */
  CONDITIONAL_IF = "CONDITIONAL_IF",
  /** Doesn't satisfy then schema condition */
  CONDITIONAL_THEN = "CONDITIONAL_THEN",
  /** Doesn't satisfy else schema condition */
  CONDITIONAL_ELSE = "CONDITIONAL_ELSE",

  // Composition validation
  /** Must match exactly one schema (oneOf) */
  COMPOSITION_ONE_OF = "COMPOSITION_ONE_OF",
  /** Must match at least one schema (anyOf) */
  COMPOSITION_ANY_OF = "COMPOSITION_ANY_OF",
  /** Must match all schemas (allOf) */
  COMPOSITION_ALL_OF = "COMPOSITION_ALL_OF",
  /** Must not match the schema (not) */
  COMPOSITION_NOT = "COMPOSITION_NOT",

  // Content validation
  /** Invalid discriminator value */
  CONTENT_DISCRIMINATOR = "CONTENT_DISCRIMINATOR",
  /** Invalid content encoding */
  CONTENT_ENCODING = "CONTENT_ENCODING",
  /** Invalid content media type */
  CONTENT_MEDIA_TYPE = "CONTENT_MEDIA_TYPE",

  // Custom keywords (ajv-keywords)
  /** Value outside allowed range */
  CUSTOM_RANGE = "CUSTOM_RANGE",
  /** Value outside exclusive range */
  CUSTOM_EXCLUSIVE_RANGE = "CUSTOM_EXCLUSIVE_RANGE",
  /** Doesn't match regular expression */
  CUSTOM_REGEXP = "CUSTOM_REGEXP",
  /** Failed to apply dynamic default */
  CUSTOM_DYNAMIC_DEFAULTS = "CUSTOM_DYNAMIC_DEFAULTS",
  /** Doesn't match any selected case */
  CUSTOM_SELECT = "CUSTOM_SELECT",
  /** Transformation failed */
  CUSTOM_TRANSFORM = "CUSTOM_TRANSFORM",
  /** Items don't have unique property values */
  CUSTOM_UNIQUE_ITEM_PROPERTIES = "CUSTOM_UNIQUE_ITEM_PROPERTIES",

  // Fallback
  /** Unknown validation error */
  UNKNOWN = "UNKNOWN",
}

export type TypeboxValidationMessages = typeof TYPEBOX_MESSAGE_CODES;
