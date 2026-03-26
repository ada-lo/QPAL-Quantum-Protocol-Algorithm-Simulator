import type {
  WorkspaceBenchmarkResponse,
  WorkspaceCatalogResponse,
  WorkspaceInstruction,
  WorkspaceSimulationResponse,
} from "./types"

const API_BASE = import.meta.env.VITE_API_URL ?? ""

async function request<T>(path: string, init?: RequestInit): Promise<T> {
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

export function simulateWorkspaceProgram(
  instructions: WorkspaceInstruction[],
  opts?: { noiseModel?: string; preferGpu?: boolean },
) {
  return request<WorkspaceSimulationResponse>("/api/workspace/simulate", {
    method: "POST",
    body: JSON.stringify({
      instructions,
      ...(opts?.noiseModel   ? { noise_model: opts.noiseModel }   : {}),
      ...(opts?.preferGpu    ? { prefer_gpu: opts.preferGpu }      : {}),
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
