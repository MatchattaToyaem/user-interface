export interface SourceRef {
  file: string
  subfolder: string
  score: number
  chunk_id: string
  document_path: string
}

export interface MessageResponse {
  message: string
  sender: string
  confidence: number
  model: string
  sources: SourceRef[]
}
