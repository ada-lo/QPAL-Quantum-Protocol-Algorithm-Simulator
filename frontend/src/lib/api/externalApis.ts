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
  const response = await fetch(
    `https://export.arxiv.org/api/query?search_query=ti:${encodeURIComponent(query)}&max_results=5&sortBy=relevance`,
  )

  if (!response.ok) {
    throw new Error(`arXiv request failed with status ${response.status}`)
  }

  const xml = await response.text()
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, "application/xml")
  const parserError = doc.querySelector("parsererror")
  if (parserError) {
    throw new Error("Failed to parse arXiv response.")
  }

  return Array.from(doc.getElementsByTagName("entry")).map((entry, index) => {
    const getText = (tagName: string) => entry.getElementsByTagName(tagName)[0]?.textContent?.trim() ?? ""
    const links = Array.from(entry.getElementsByTagName("link"))
    const alternateLink =
      links.find((link) => link.getAttribute("rel") === "alternate")?.getAttribute("href") ??
      getText("id")

    return {
      id: getText("id") || `${query}-${index}`,
      title: getText("title").replace(/\s+/g, " "),
      authors: Array.from(entry.getElementsByTagName("author")).map((author) => author.getElementsByTagName("name")[0]?.textContent?.trim() ?? "Unknown"),
      published: getText("published"),
      summary: getText("summary").replace(/\s+/g, " "),
      link: alternateLink,
    }
  })
}
