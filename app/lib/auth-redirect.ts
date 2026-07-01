export const DEFAULT_AUTH_REDIRECT = "/dashboard";
const RELATIVE_URL_PARSE_BASE = "http://localhost";

type CallbackInput = string | string[] | undefined;

function firstValue(value: CallbackInput) {
  return Array.isArray(value) ? value[0] : value;
}

export function getSafeCallbackPath(
  value: CallbackInput,
  fallback = DEFAULT_AUTH_REDIRECT,
) {
  const candidate = firstValue(value);

  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  try {
    // Use a throwaway origin so URL() can normalize internal relative paths.
    const parsed = new URL(candidate, RELATIVE_URL_PARSE_BASE);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
