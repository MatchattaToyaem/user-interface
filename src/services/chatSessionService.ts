import { authService } from '@/services/authService'

const CHAT_API_BASE = import.meta.env.VITE_CHAT_SERVICE_URL || 'http://localhost:8082'

export interface ChatSessionResponse {
  id: string
  chatName: string
  userName: string
  chatHistory: string
  createdBy: string
  lastAccess: string
  status: string
}

export interface ChatHistoryEntry {
  question: string
  answer: string
  document_reference_id: string
  response_time: string
  response_date: string
}

export interface ChatSessionRequest {
  chatName: string
  userName: string
  chatHistory?: string
  createdBy: string
  status?: string
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await authService.getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

export const chatSessionService = {
  async getSessionsByUser(userName: string): Promise<ChatSessionResponse[]> {
    const headers = await authHeaders()
    const res = await fetch(`${CHAT_API_BASE}/api/chat-sessions/user/${encodeURIComponent(userName)}`, { headers })
    if (!res.ok) return []
    return res.json()
  },

  async getSessionById(id: string): Promise<ChatSessionResponse | null> {
    const headers = await authHeaders()
    const res = await fetch(`${CHAT_API_BASE}/api/chat-sessions/${encodeURIComponent(id)}`, { headers })
    if (!res.ok) return null
    return res.json()
  },

  async createSession(request: ChatSessionRequest): Promise<ChatSessionResponse | null> {
    const headers = await authHeaders()
    const res = await fetch(`${CHAT_API_BASE}/api/chat-sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    })
    if (!res.ok) {
      console.error('Failed to create chat session:', res.status)
      return null
    }
    return res.json()
  },

  async deleteSession(id: string): Promise<boolean> {
    const headers = await authHeaders()
    const res = await fetch(`${CHAT_API_BASE}/api/chat-sessions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers
    })
    return res.ok
  },

  async updateSession(id: string, request: ChatSessionRequest): Promise<ChatSessionResponse | null> {
    const headers = await authHeaders()
    const res = await fetch(`${CHAT_API_BASE}/api/chat-sessions/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(request)
    })
    if (!res.ok) return null
    return res.json()
  }
}
