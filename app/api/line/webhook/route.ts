import { NextRequest, NextResponse } from "next/server"

import { dispatchWeatherUpdate } from "@/lib/line/weather-dispatch"
import { reply } from "@/lib/line/client"
import { verifyLineSignature } from "@/lib/line/signature"
import { addSubscriber, removeSubscriber } from "@/lib/line/subscriber-store"
import type { LineMessageEvent, LineWebhookRequest } from "@/lib/line/types"
import { getDefaultLineLocation } from "@/lib/line/config"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-line-signature")
  const bodyText = await request.text()

  if (!verifyLineSignature(bodyText, signature)) {
    return new Response("Invalid signature", { status: 401 })
  }

  let payload: LineWebhookRequest
  try {
    payload = JSON.parse(bodyText) as LineWebhookRequest
  } catch (error) {
    console.error("Invalid LINE webhook payload", error)
    return new Response("Bad request", { status: 400 })
  }

  if (!payload.events || payload.events.length === 0) {
    return NextResponse.json({ ok: true })
  }

  for (const event of payload.events) {
    if (event.type === "follow") {
      const userId = extractUserId(event.source)
      if (userId) {
        await addSubscriber({ userId })
        await safeReply(event.replyToken, [
          {
            type: "text",
            text: "ขอบคุณที่ติดตาม SEAPALO! จะส่งอัปเดตทุก 2 ชั่วโมงให้คุณ หรือพิมพ์คำว่า 'อัปเดต' เพื่อรับข้อมูลทันที",
          },
        ])
      }
    } else if (event.type === "unfollow") {
      const userId = extractUserId(event.source)
      if (userId) {
        await removeSubscriber(userId)
      }
    } else if (event.type === "message") {
      await handleMessageEvent(event)
    }
  }

  return NextResponse.json({ ok: true })
}

async function handleMessageEvent(event: LineMessageEvent): Promise<void> {
  if (event.message.type !== "text") {
    await safeReply(event.replyToken, [
      {
        type: "text",
        text: "ตอนนี้ระบบรองรับข้อความแบบตัวอักษรเท่านั้นนะครับ",
      },
    ])
    return
  }

  const userId = extractUserId(event.source)
  if (!userId) {
    await safeReply(event.replyToken, [
      {
        type: "text",
        text: "ไม่พบรหัสผู้ใช้จากเหตุการณ์นี้",
      },
    ])
    return
  }

  const text = event.message.text.trim().toLowerCase()

  if (["ยกเลิก", "หยุด", "stop"].includes(text)) {
    await removeSubscriber(userId)
    await safeReply(event.replyToken, [
      {
        type: "text",
        text: "หยุดส่งอัปเดตแล้ว หากต้องการเริ่มอีกครั้ง พิมพ์คำว่า 'สมัคร'",
      },
    ])
    return
  }

  if (["สมัคร", "start", "เริ่ม", "follow"].includes(text)) {
    await addSubscriber({ userId })
    await safeReply(event.replyToken, [
      {
        type: "text",
        text: "ลงทะเบียนเรียบร้อย จะส่งข้อมูลให้อัตโนมัติทุก 2 ชั่วโมง",
      },
    ])
    return
  }

  if (["อัปเดต", "update", "พยากรณ์", "forecast"].includes(text)) {
    await safeReply(event.replyToken, [
      {
        type: "text",
        text: "กำลังจัดเตรียมข้อมูลล่าสุดให้ครับ",
      },
    ])

    await dispatchWeatherUpdate({
      userIds: [userId],
      location: getDefaultLineLocation(),
      broadcast: false,
    })
    return
  }

  await safeReply(event.replyToken, [
    {
      type: "text",
      text: "คำสั่งที่ใช้ได้: 'อัปเดต' เพื่อรับข้อมูลล่าสุด, 'สมัคร' เพื่อรับอัปเดตอัตโนมัติ, 'หยุด' เพื่อยกเลิก",
    },
  ])
}

function extractUserId(source: LineMessageEvent["source"]): string | undefined {
  if (source.type === "user") {
    return source.userId
  }
  return source.userId
}

async function safeReply(replyToken: string | undefined, messages: Parameters<typeof reply>[1]): Promise<void> {
  if (!replyToken) return
  try {
    await reply(replyToken, messages)
  } catch (error) {
    console.error("Failed to reply to LINE message", error)
  }
}
