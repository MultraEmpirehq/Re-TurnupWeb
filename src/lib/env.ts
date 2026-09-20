import Joi from "joi";

/**
 * Every environment variable the web app reads, checked once at startup.
 *
 * Next.js inlines `NEXT_PUBLIC_*` at build time, so each one has to be written out
 * literally here: `process.env[name]` returns undefined in the browser. The values are
 * baked into the bundle, which also means a missing variable is a deploy mistake
 * rather than a runtime condition, and is worth failing loudly for.
 */
const raw = {
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_API_VERSION: process.env.NEXT_PUBLIC_API_VERSION,
  NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  NEXT_PUBLIC_APPLE_WEB_CLIENT_ID: process.env.NEXT_PUBLIC_APPLE_WEB_CLIENT_ID,
  NEXT_PUBLIC_APPLE_REDIRECT_URI: process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
};

export interface WebEnv {
  NEXT_PUBLIC_BASE_URL: string;
  NEXT_PUBLIC_API_VERSION: string;
  NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID: string;
  NEXT_PUBLIC_APPLE_WEB_CLIENT_ID: string;
  NEXT_PUBLIC_APPLE_REDIRECT_URI: string;
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: string;
}

/**
 * Required entries stop the app; optional ones only disable the feature that needs
 * them, so they warn instead. An empty string counts as absent either way.
 */
const schema = Joi.object<WebEnv>({
  NEXT_PUBLIC_BASE_URL: Joi.string().uri().required().messages({
    "string.uri": "NEXT_PUBLIC_BASE_URL must be a full url, e.g. https://api.turnup.ng/api",
    "any.required": "NEXT_PUBLIC_BASE_URL is required; it is the api the app talks to.",
    "string.empty": "NEXT_PUBLIC_BASE_URL is required; it is the api the app talks to.",
  }),
  NEXT_PUBLIC_API_VERSION: Joi.string()
    .pattern(/^v\d+$/)
    .required()
    .messages({
      "string.pattern.base": "NEXT_PUBLIC_API_VERSION must look like v1.",
      "any.required": "NEXT_PUBLIC_API_VERSION is required, e.g. v1.",
      "string.empty": "NEXT_PUBLIC_API_VERSION is required, e.g. v1.",
    }),
  NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID: Joi.string().allow("").default(""),
  NEXT_PUBLIC_APPLE_WEB_CLIENT_ID: Joi.string().allow("").default(""),
  NEXT_PUBLIC_APPLE_REDIRECT_URI: Joi.string().uri().allow("").default(""),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: Joi.string().allow("").default(""),
});

const { error, value } = schema.validate(raw, {
  abortEarly: false,
  stripUnknown: true,
});

if (error) {
  const details = error.details.map((detail) => `  - ${detail.message}`).join("\n");
  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = value as WebEnv;

/** Features that quietly do nothing when their key is missing, so this says so once. */
const OPTIONAL_FEATURES: Array<[keyof WebEnv, string]> = [
  ["NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "maps and address autocomplete"],
  ["NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID", "sign in with Google"],
  ["NEXT_PUBLIC_APPLE_WEB_CLIENT_ID", "sign in with Apple"],
];

if (process.env.NODE_ENV !== "production") {
  const missing = OPTIONAL_FEATURES.filter(([key]) => !env[key]);
  if (missing.length) {
    console.warn(
      `Disabled, no key configured:\n${missing
        .map(([key, feature]) => `  - ${feature} (${key})`)
        .join("\n")}`,
    );
  }
}

export const apiBaseUrl = `${env.NEXT_PUBLIC_BASE_URL}/${env.NEXT_PUBLIC_API_VERSION}`;
