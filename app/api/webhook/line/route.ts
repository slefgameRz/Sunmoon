import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { handleLineMessage, sendWelcomeMessage } from '@/lib/services/line-service'

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
    console.error('❌ LINE_CHANNEL_SECRET is not configured')
    return false
  }

  const hash = crypto
    .createHmac('SHA256', CHANNEL_SECRET)
    .update(body)
    .digest('base64')

  const isValid = hash === signature
  
  if (!isValid) {
    console.error('❌ Signature mismatch')
    console.error('Expected:', signature)
    console.error('Got:', hash)
  } else {
    console.log('✅ Signature verified')
  }
  
  return isValid
}

/**
 * POST /api/webhook/line
 * Handle incoming webhook events from LINE
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-line-signature')
    const bodyText = await request.text()

    console.log('📨 Webhook received')
    console.log('Signature header:', signature ? '✅ Present' : '❌ Missing')

    // Verify signature
    if (!signature || !verifySignature(bodyText, signature)) {
      console.error('❌ Invalid LINE signature - Rejecting request')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const body = JSON.parse(bodyText)
    const events = body.events || []

    console.log(`📦 Processing ${events.length} event(s)`)

    // Process each event
    for (const event of events) {
      try {
        if (event.type === 'message') {
          console.log(`💬 Message from ${event.source.userId}`)
          console.log('Message type:', event.message?.type)
          console.log('Message text:', event.message?.text)
          await handleLineMessage(event)
          console.log('✅ Message processed')
        } else if (event.type === 'follow') {
          console.log(`👥 User ${event.source.userId} followed`)
          await sendWelcomeMessage(event.replyToken)
          console.log('✅ Welcome sent')
        } else if (event.type === 'unfollow') {
          console.log(`👋 User ${event.source.userId} unfollowed`)
        }
      } catch (eventError) {
        console.error('❌ Error processing event:', eventError)
        // Continue processing other events
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Webhook error:', error)
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
    secrets: {
      channelSecret: process.env.LINE_CHANNEL_SECRET ? '✅ Set' : '❌ Missing',
      accessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ? '✅ Set' : '❌ Missing',
    }
  })
}

