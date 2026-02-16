import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { userSettings } from '@/lib/db'
import { eq } from 'drizzle-orm'

const LYZR_UPLOAD_URL = 'https://agent-prod.studio.lyzr.ai/v3/assets/upload'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await auth()
    const session = authResult?.session

    if (!session?.userId) {
      return NextResponse.json(
        {
          success: false,
          asset_ids: [],
          files: [],
          total_files: 0,
          successful_uploads: 0,
          failed_uploads: 0,
          message: 'Unauthorized',
          timestamp: new Date().toISOString(),
          error: 'Unauthorized',
        },
        { status: 401 }
      )
    }

    // Fetch user's API key from database
    const settings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.userId))
      .limit(1)

    if (settings.length === 0 || !settings[0].lyzrApiKey) {
      return NextResponse.json(
        {
          success: false,
          asset_ids: [],
          files: [],
          total_files: 0,
          successful_uploads: 0,
          failed_uploads: 0,
          message: 'LYZR_API_KEY not configured. Please add your API key in Settings.',
          timestamp: new Date().toISOString(),
          error: 'LYZR_API_KEY not configured. Please add your API key in Settings.',
        },
        { status: 500 }
      )
    }

    const LYZR_API_KEY = settings[0].lyzrApiKey

    const formData = await request.formData()
    const files = formData.getAll('files')

    if (files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          asset_ids: [],
          files: [],
          total_files: 0,
          successful_uploads: 0,
          failed_uploads: 0,
          message: 'No files provided',
          timestamp: new Date().toISOString(),
          error: 'No files provided',
        },
        { status: 400 }
      )
    }

    // Forward the request to Lyzr API
    const uploadFormData = new FormData()
    for (const file of files) {
      if (file instanceof File) {
        uploadFormData.append('files', file, file.name)
      }
    }

    const response = await fetch(LYZR_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'x-api-key': LYZR_API_KEY,
      },
      body: uploadFormData,
    })

    if (response.ok) {
      const data = await response.json()

      const uploadedFiles = (data.results || []).map((r: any) => ({
        asset_id: r.asset_id || '',
        file_name: r.file_name || '',
        success: r.success ?? true,
        error: r.error,
      }))

      const assetIds = uploadedFiles
        .filter((f: any) => f.success && f.asset_id)
        .map((f: any) => f.asset_id)

      return NextResponse.json({
        success: true,
        asset_ids: assetIds,
        files: uploadedFiles,
        total_files: data.total_files || files.length,
        successful_uploads: data.successful_uploads || assetIds.length,
        failed_uploads: data.failed_uploads || 0,
        message: `Successfully uploaded ${assetIds.length} file(s)`,
        timestamp: new Date().toISOString(),
      })
    } else {
      const errorText = await response.text()
      console.error('Upload API error:', response.status, errorText)

      return NextResponse.json(
        {
          success: false,
          asset_ids: [],
          files: [],
          total_files: files.length,
          successful_uploads: 0,
          failed_uploads: files.length,
          message: `Upload failed with status ${response.status}`,
          timestamp: new Date().toISOString(),
          error: errorText,
        },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('File upload error:', error)

    return NextResponse.json(
      {
        success: false,
        asset_ids: [],
        files: [],
        total_files: 0,
        successful_uploads: 0,
        failed_uploads: 0,
        message: 'Server error during upload',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
