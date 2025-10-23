import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * LINE Webhook API endpoint
 * Receives events from LINE Official Account
 */

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || ''

/**
 * Verify LINE signature to ensure request is from LINE
 */
function verifySignature(body: string, signature: string): boolean {
  if (!CHANNEL_SECRET) {
    console.error('LINE_CHANNEL_SECRET is not configured')
    return false
  }

  const hash = crypto
    .createHmac('SHA256', CHANNEL_SECRET)
    .update(body)
    .digest('base64')

  return hash === signature
}

/**
 * POST /api/webhook/line
 * Handle incoming webhook events from LINE
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-line-signature')
    const bodyText = await request.text()

    // Verify signature
    if (!signature || !verifySignature(bodyText, signature)) {
      console.error('Invalid LINE signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const body = JSON.parse(bodyText)
    const events = body.events || []

    // Process each event
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userId = event.source.userId
        const messageText = event.message.text
        // const replyToken = event.replyToken

        console.log(`Received message from ${userId}: ${messageText}`)

        // TODO: Implement message handling
        // For now, just log the message
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('LINE webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/webhook/line
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'LINE Webhook',
    timestamp: new Date().toISOString(),
  })
}
