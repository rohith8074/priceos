'use client'

import { useState } from 'react'

export interface NormalizedAgentResponse {
  status: 'success' | 'error'
  result: Record<string, any>
  message?: string
  metadata?: {
    agent_name?: string
    timestamp?: string
    [key: string]: any
  }
}

export interface AIAgentResponse {
  success: boolean
  response: NormalizedAgentResponse
  agent_id?: string
  user_id?: string
  session_id?: string
  timestamp?: string
  raw_response?: string
  error?: string
  details?: string
}

export interface UploadedFile {
  asset_id: string
  file_name: string
  success: boolean
  error?: string
}

export interface UploadResponse {
  success: boolean
  asset_ids: string[]
  files: UploadedFile[]
  total_files: number
  successful_uploads: number
  failed_uploads: number
  message: string
  timestamp: string
  error?: string
}

export async function callAIAgent(
  message: string,
  agent_id: string,
  options?: { user_id?: string; session_id?: string; assets?: string[] }
): Promise<AIAgentResponse> {
  try {
    const response = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        agent_id,
        user_id: options?.user_id,
        session_id: options?.session_id,
        assets: options?.assets,
      }),
    })
    return await response.json()
  } catch (error) {
    return {
      success: false,
      response: {
        status: 'error',
        result: {},
        message: error instanceof Error ? error.message : 'Network error',
      },
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

export async function uploadFiles(files: File | File[]): Promise<UploadResponse> {
  const fileArray = Array.isArray(files) ? files : [files]
  if (fileArray.length === 0) {
    return {
      success: false, asset_ids: [], files: [], total_files: 0,
      successful_uploads: 0, failed_uploads: 0,
      message: 'No files provided', timestamp: new Date().toISOString(),
      error: 'No files provided',
    }
  }
  try {
    const formData = new FormData()
    for (const file of fileArray) formData.append('files', file, file.name)
    const response = await fetch('/api/upload', { method: 'POST', body: formData })
    return await response.json()
  } catch (error) {
    return {
      success: false, asset_ids: [], files: [],
      total_files: fileArray.length, successful_uploads: 0,
      failed_uploads: fileArray.length,
      message: 'Network error during upload',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export function useAIAgent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<NormalizedAgentResponse | null>(null)

  const callAgent = async (
    message: string,
    agent_id: string,
    options?: { user_id?: string; session_id?: string; assets?: string[] }
  ) => {
    setLoading(true)
    setError(null)
    setResponse(null)
    const result = await callAIAgent(message, agent_id, options)
    if (result.success) setResponse(result.response)
    else {
      setError(result.error || 'Unknown error')
      setResponse(result.response)
    }
    setLoading(false)
    return result
  }

  return { callAgent, loading, error, response }
}

export function extractText(response: NormalizedAgentResponse): string {
  if (response.message) return response.message
  if (response.result?.text) return response.result.text
  if (response.result?.message) return response.result.message
  if (response.result?.answer) return response.result.answer
  if (response.result?.answer_text) return response.result.answer_text
  if (typeof response.result === 'string') return response.result
  return ''
}
