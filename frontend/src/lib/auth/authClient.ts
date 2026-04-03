import { createAuthClient } from "@neondatabase/neon-js/auth"

const authUrl = import.meta.env.VITE_NEON_AUTH_URL

if (!authUrl) {
  throw new Error("Missing VITE_NEON_AUTH_URL in the frontend environment.")
}

export const authClient = createAuthClient(authUrl)

export async function getAuthToken() {
  const session = await authClient.getSession()
  return session.data?.session?.token ?? null
}
