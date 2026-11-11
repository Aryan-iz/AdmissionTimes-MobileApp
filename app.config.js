/**
 * Expo config = app.json plus values that differ per build.
 *
 * API_BASE_URL comes from the build environment (eas.json profiles or
 * `API_BASE_URL=... npx expo start`). Without it the app falls back to the
 * local development backend (see src/config/env.ts).
 */
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    ...(process.env.API_BASE_URL ? { API_BASE_URL: process.env.API_BASE_URL } : {}),
  },
});
