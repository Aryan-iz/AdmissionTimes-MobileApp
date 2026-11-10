/**
 * App logger. `debug` output appears only in development builds (__DEV__);
 * warnings and errors are always reported. Never log tokens, emails or other
 * personal data.
 */
export const createLogger = (scope: string) => ({
  debug: (message: string, ...details: unknown[]) => {
    if (__DEV__) console.debug(`[${scope}] ${message}`, ...details)
  },
  warn: (message: string, ...details: unknown[]) => console.warn(`[${scope}] ${message}`, ...details),
  error: (message: string, ...details: unknown[]) => console.error(`[${scope}] ${message}`, ...details),
})
