export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  references?: Reference[]
  isStreaming?: boolean
}

export interface Reference {
  id: string
  title: string
  authors: string[]
  journal: string
  year: number
  doi?: string
  url: string
  relevanceScore: number
  abstract?: string
}

export interface PaperSearchResult {
  papers: Reference[]
  query: string
  totalFound: number
}