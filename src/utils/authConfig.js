// src/utils/authConfig.js

/**
 * Public hosted production domain of the ITFS application.
 * All email verification and password reset action links must point to this public URL,
 * never localhost, so that users clicking links in Gmail on any device are routed correctly.
 */
export const PUBLIC_HOSTED_URL = "https://innovative-teaching-feed-2d77a.web.app";

/**
 * Generates Firebase Auth ActionCodeSettings pointing to the public hosted URL.
 * Automatically avoids 'localhost' / '127.0.0.1' so generated email links always work publicly.
 *
 * @param {string} path - Target path e.g. '/reset-password' or '/verify-email'
 * @returns {import('firebase/auth').ActionCodeSettings}
 */
export const getActionCodeSettings = (path = "/reset-password") => {
  const origin = typeof window !== 'undefined' ? window.location.origin : PUBLIC_HOSTED_URL;
  const isLocal = origin.includes("localhost") || origin.includes("127.0.0.1");
  const baseUrl = isLocal ? PUBLIC_HOSTED_URL : origin;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return {
    url: `${baseUrl}${cleanPath}`,
    handleCodeInApp: true
  };
};

/**
 * Returns the base public app URL with an optional path and query.
 *
 * @param {string} path
 * @returns {string}
 */
export const getPublicAppUrl = (path = "") => {
  const origin = typeof window !== 'undefined' ? window.location.origin : PUBLIC_HOSTED_URL;
  const isLocal = origin.includes("localhost") || origin.includes("127.0.0.1");
  const baseUrl = isLocal ? PUBLIC_HOSTED_URL : origin;
  if (!path) return baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};
