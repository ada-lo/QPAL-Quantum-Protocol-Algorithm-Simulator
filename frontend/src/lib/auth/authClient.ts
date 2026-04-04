import { createAuthClient } from "@neondatabase/neon-js/auth"

const authUrl = import.meta.env.VITE_NEON_AUTH_URL

if (!authUrl) {
  throw new Error("Missing VITE_NEON_AUTH_URL in the frontend environment.")
}

export const authClient = createAuthClient(authUrl)

/**
 * Retrieve the current JWT access token for backend API calls.
 *
 * Primary path:  authClient.token()  → returns the raw JWT string
 * Fallback path: authClient.getSession() → dig into session object
 *
 * The opaque session token (session.token) is NOT a JWT and will fail
 * RS256/EdDSA verification on the backend.
 */
export async function getAuthToken(): Promise<string | null> {
  // Primary: dedicated JWT accessor
  try {
    const tokenResult = await (authClient as any).token()
    const jwt = tokenResult?.data?.token ?? tokenResult?.token ?? null
    if (jwt && typeof jwt === "string" && jwt.includes(".")) return jwt
  } catch {
    // token() may not exist on older SDK versions — fall through
  }

  // Fallback: extract from session object
  try {
    const session = await authClient.getSession()
    const s = session?.data?.session ?? (session as any)?.session
    // Prefer access_token (JWT) over token (opaque)
    const jwt = s?.access_token ?? s?.accessToken ?? null
    if (jwt && typeof jwt === "string" && jwt.includes(".")) return jwt
    // Last resort: try the raw token field (may be JWT in some configurations)
    return s?.token ?? null
  } catch {
    return null
  }
}
