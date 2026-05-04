import type {
  WorkspaceAnalysisResponse,
  WorkspaceBenchmarkResponse,
  WorkspaceCatalogResponse,
  WorkspaceSimulationResponse,
} from "./types"
import { getAuthToken } from "@/lib/auth/authClient"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAuthToken()
  if (!token) {
    throw new Error("Authentication required. Sign in to access the workspace.")
  }

  const makeRequest = async (authToken: string) => {
    return fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        ...(init?.headers ?? {}),
      },
    })
  }

  let response = await makeRequest(token)

  // On 401, attempt to re-fetch a fresh token and retry once
  if (response.status === 401) {
    const freshToken = await getAuthToken()
    if (freshToken && freshToken !== token) {
      response = await makeRequest(freshToken)
    }
  }

  if (response.status === 401) {
    throw new Error("Your session expired or could not be verified. Sign in again.")
  }

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return response.json() as Promise<T>
}

async function publicRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return response.json() as Promise<T>
}

export function fetchWorkspaceCatalog() {
  return request<WorkspaceCatalogResponse>("/api/workspace/catalog")
}

export function fetchPublicWorkspaceCatalog() {
  return publicRequest<WorkspaceCatalogResponse>("/api/workspace/catalog")
}

export function simulateWorkspaceProgram(
  code: string,
  engine: string,
  opts?: { noiseModel?: string; preferGpu?: boolean },
) {
  console.log("[SIM_INIT] Sending Simulation Payload:", { engine, codeLength: code.length })
  return request<WorkspaceSimulationResponse>("/api/workspace/simulate", {
    method: "POST",
    body: JSON.stringify({
      code,
      engine,
      ...(opts?.noiseModel   ? { noise_model: opts.noiseModel }   : {}),
      ...(opts?.preferGpu !== undefined ? { compute: opts.preferGpu ? "gpu" : "cpu" } : {}),
    }),
  })
}

export function runWorkspaceBenchmarks(benchmarkIds?: string[]) {
  return request<WorkspaceBenchmarkResponse>("/api/workspace/benchmarks", {
    method: "POST",
    body: JSON.stringify({
      benchmark_ids: benchmarkIds,
      repetitions: 1,
      prefer_gpu: true,
    }),
  })
}

export function runWorkspaceAnalysis(payload: Record<string, unknown>) {
  return request<WorkspaceAnalysisResponse>("/api/workspace/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
