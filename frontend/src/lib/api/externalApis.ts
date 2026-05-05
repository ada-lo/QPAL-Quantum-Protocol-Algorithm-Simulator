export interface WikipediaSummary {
  title: string
  extract: string
  description?: string
  contentUrl?: string | null
  source: "wikipedia" | "fallback"
}

export interface ArxivPaper {
  id: string
  title: string
  authors: string[]
  published: string
  summary: string
  link: string
}

const WIKIPEDIA_CACHE_PREFIX = "qpal:wikipedia:"
const ARXIV_CACHE_PREFIX = "qpal:arxiv:"
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

interface WikipediaApiPayload {
  title?: string
  extract?: string
  description?: string
  content_urls?: {
    desktop?: {
      page?: string
    }
  }
}

function getWikipediaCacheKey(query: string) {
  return `${WIKIPEDIA_CACHE_PREFIX}${query.toLowerCase()}`
}

function getArxivCacheKey(query: string) {
  return `${ARXIV_CACHE_PREFIX}${query.toLowerCase()}`
}

export async function fetchWikipediaSummary(query: string, fallbackDescription: string): Promise<WikipediaSummary> {
  const cacheKey = getWikipediaCacheKey(query)

  if (typeof window !== "undefined") {
    const cached = window.sessionStorage.getItem(cacheKey)
    if (cached) {
      try {
        return JSON.parse(cached) as WikipediaSummary
      } catch {
        window.sessionStorage.removeItem(cacheKey)
      }
    }
  }

  try {
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`)
    if (!response.ok) {
      throw new Error(`Wikipedia request failed with status ${response.status}`)
    }

    const payload = (await response.json()) as WikipediaApiPayload
    const summary: WikipediaSummary = {
      title: payload.title || query,
      extract: payload.extract || fallbackDescription,
      description: payload.description,
      contentUrl: payload.content_urls?.desktop?.page ?? null,
      source: "wikipedia",
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(cacheKey, JSON.stringify(summary))
    }

    return summary
  } catch {
    return {
      title: query,
      extract: fallbackDescription,
      source: "fallback",
      contentUrl: null,
    }
  }
}

export async function fetchArxivPapers(query: string): Promise<ArxivPaper[]> {
  const cacheKey = getArxivCacheKey(query)

  if (typeof window !== "undefined") {
    const cached = window.sessionStorage.getItem(cacheKey)
    if (cached) {
      try {
        return JSON.parse(cached) as ArxivPaper[]
      } catch {
        window.sessionStorage.removeItem(cacheKey)
      }
    }
  }

  const response = await fetch(`${API_BASE}/api/workspace/papers?query=${encodeURIComponent(query)}`)
  if (!response.ok) {
    throw new Error(await response.text())
  }

  const papers = (await response.json()) as ArxivPaper[]

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(cacheKey, JSON.stringify(papers))
  }

  return papers
}
