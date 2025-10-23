# 🧪 LINE OA Testing Setup Guide

**Complete guide to test your LINE integration locally and in production**

---

## 📋 Prerequisites

1. **LINE Official Account** - Already created at [LINE Developers Console](https://developers.line.biz)
2. **Channel credentials** - In `.env.local`:
   - `LINE_CHANNEL_ID` ✅
   - `LINE_CHANNEL_SECRET` ✅
   - `LINE_CHANNEL_ACCESS_TOKEN` ✅
3. **Dev server running** - `pnpm dev`
4. **Tunnel exposure** - ngrok or dev tunnel

---

## 🚀 Quick Start: Test Locally

### Step 1: Start Development Server

```bash
cd d:\Sunmoon
pnpm dev
```

**Expected output:**
```
✓ Ready in 4s
- Local:        http://localhost:3000
- Network:      http://xxx.xxx.xxx.xxx:3000
```

### Step 2: Expose to Internet (ngrok)

**In a new terminal:**

```bash
# Install ngrok (if not already)
# From: https://ngrok.com/download

# Start ngrok
ngrok http 3000
```

**Expected output:**
```
ngrok                                                                       (Ctrl+C to quit)

Session Status                online
Account                       <your-account>
Version                       3.x.x
Region                        us
Latency                       xx ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
```

**Copy the Forwarding URL:** `https://abc123def456.ngrok-free.app`

### Step 3: Update LINE Webhook URL

1. Go to [LINE Developers Console](https://developers.line.biz)
2. Select your channel
3. Go to **Messaging API** tab
4. Find **Webhook URL**
5. Update to: `https://abc123def456.ngrok-free.app/api/webhook/line`
6. Click **Verify** (should show ✓)
7. Click **Save**

**Verify in console output:**
```
✓ Webhook URL verified
```

### Step 4: Add Bot as Friend on LINE

1. Open LINE app
2. Search for your bot ID or scan the QR code
3. Click "Add as friend"
4. Should receive welcome message ✅

---

## 🧪 Testing Scenarios

### Test 1: Text Message (Location Query)

**What to test:**
```
Send: "ทำนายน้ำ ภูเก็ต"
Expected: Brief summary with tide + temp + wind
```

**Check in console:**
```
📨 Webhook received
✅ Signature verified
📝 Processing text message
📍 Parsed location: { lat: 8.627, lon: 98.398, name: 'ภูเก็ต' }
📊 Forecast: { tideData: {...}, weatherData: {...} }
📤 Sending 1 message(s) to LINE
✅ Message sent successfully
```

**Expected reply format:**
```
🌊 ภูเก็ต
────────────
⬆️ น้ำ | 🌡️ 28°C | 💨 3 m/s
────────────
🔗 ดูละเอียด
https://yourdomain.com/forecast?lat=8.627&lon=98.398&mode=full

💡 ส่งจังหวัดอื่นหรือแชร์📍 GPS
```

---

### Test 2: Location Sharing (GPS)

**What to test:**
```
Send: Share GPS location
Expected: Same forecast format as text message
```

**Check in console:**
```
📨 Webhook received
✅ Signature verified
📍 Processing location message
📍 Location: { lat: 8.627, lon: 98.398, name: '...' }
📤 Sending 1 message(s) to LINE
✅ Message sent successfully
```

---

### Test 3: Invalid Input

**What to test:**
```
Send: "สวัสดีค่ะ"
Expected: Help message with examples
```

**Expected reply:**
```
📍 กรุณาระบุจังหวัด เช่น:
• ทำนายน้ำ ภูเก็ต
• สภาพอากาศ ระยอง
• ข้อมูล หาดใหญ่

หรือแชร์📍 ตำแหน่ง GPS
```

---

### Test 4: Follow Event

**What to test:**
```
Add bot as friend
Expected: Welcome message
```

**Expected reply:**
```
👋 สวัสดีครับ! ยินดีต้อนรับเข้าสู่ 🌊 Sunmoon

⚡ ส่งจังหวัดจะได้สรุปข้อมูลแบบด่วน
📍 แชร์ GPS สำหรับพื้นที่อื่นๆ
🔗 ดูละเอียดได้บนเว็บ

ตัวอย่าง: ทำนายน้ำ ภูเก็ต
```

---

## 🔍 Debugging Checklist

### Webhook Not Receiving Messages

- [ ] Webhook URL updated in LINE Console
- [ ] URL format correct: `https://domain.com/api/webhook/line`
- [ ] Webhook is **enabled** in LINE Console
- [ ] ngrok tunnel is still running
- [ ] Dev server is running: `pnpm dev`

### Signature Verification Fails

- [ ] `LINE_CHANNEL_SECRET` is correct (check LINE Console)
- [ ] Restarted dev server after changing `.env.local`
- [ ] Using correct Channel Secret (not Channel Access Token)

### Message Sent but No Reply

- [ ] Check if network has internet access
- [ ] `LINE_CHANNEL_ACCESS_TOKEN` is correct
- [ ] Look in console for "✅ Message sent successfully"
- [ ] Check if you see "Error handling LINE message"

### No Console Logs

- [ ] Dev server is running in same terminal
- [ ] Not running in production mode
- [ ] Check `pnpm dev` output (not separate build)

---

## 📊 Console Log Reference

### ✅ Successful Flow

```
📨 Webhook received
Signature header: ✅ Present
✅ Signature verified
📦 Processing 1 event(s)
💬 Message from Uf4a967531890e8071e0b1eae6791245f
Message type: text
Message text: ทำนายน้ำ ภูเก็ต
📝 Processing text message
📍 Parsed location: { lat: 8.627, lon: 98.398, name: 'ภูเก็ต' }
📤 Sending 1 message(s) to LINE
✅ Message sent successfully
✅ Message processed
```

### ❌ Common Error Flows

**No signature:**
```
📨 Webhook received
Signature header: ❌ Missing
❌ Invalid LINE signature - Rejecting request
```

**Wrong signature:**
```
✅ Signature verified
Expected: signature_abc123
Got: signature_xyz789
❌ Signature mismatch
```

**Network error (offline):**
```
📤 Sending 1 message(s) to LINE
❌ Send message failed: TypeError: fetch failed
⚠️ Warning: Message send failed, but continuing...
```

---

## 🛠️ Manual Testing with curl

### Generate Test Signature

**File: `generate_signature.js`**

```javascript
const crypto = require('crypto');

// Your LINE_CHANNEL_SECRET from .env.local
const secret = 'c2539c8acbedb3e93e469eca415ffdbd';

// Test payload
const payload = JSON.stringify({
  events: [
    {
      type: "message",
      message: {
        type: "text",
        text: "ทำนายน้ำ ภูเก็ต"
      },
      replyToken: "test_reply_token_12345",
      source: {
        userId: "Uf4a967531890e8071e0b1eae6791245f"
      },
      timestamp: 1735000000000
    }
  ]
});

const signature = crypto
  .createHmac('SHA256', secret)
  .update(payload)
  .digest('base64');

console.log('Payload:');
console.log(JSON.stringify(JSON.parse(payload), null, 2));
console.log('\nSignature:');
console.log(signature);

// Save for curl
console.log('\nSave payload:');
console.log('echo \'' + payload + '\' > payload.json');
```

**Run:**
```bash
node generate_signature.js
```

**Output:**
```
Payload:
{
  "events": [
    {
      "type": "message",
      ...
    }
  ]
}

Signature:
base64_encoded_signature_here

Save payload:
echo '...' > payload.json
```

### Send Test Webhook

```bash
# Save payload
echo '{"events":[{"type":"message","message":{"type":"text","text":"ทำนายน้ำ ภูเก็ต"},"replyToken":"test_token","source":{"userId":"test_user"},"timestamp":1735000000000}]}' > payload.json

# Send with signature
curl -X POST http://localhost:3000/api/webhook/line \
  -H "Content-Type: application/json" \
  -H "X-Line-Signature: paste_your_generated_signature_here" \
  -d @payload.json

# Expected response:
# {"success":true}
```

---

## 🌐 Production Deployment

### Before Going Live

- [ ] All tests passing locally
- [ ] `.env.local` secrets are strong
- [ ] Webhook URL points to production domain
- [ ] Domain has valid HTTPS certificate
- [ ] Console logs cleaned up
- [ ] Error monitoring set up (Sentry/LogRocket)
- [ ] Database backups configured (if using)

### Deploy to Vercel

```bash
# 1. Push to GitHub
git add .
git commit -m "production: LINE integration ready"
git push origin main

# 2. Deploy to Vercel
# Vercel auto-deploys on push

# 3. Set environment variables in Vercel Dashboard
# - LINE_CHANNEL_ID
# - LINE_CHANNEL_SECRET
# - LINE_CHANNEL_ACCESS_TOKEN

# 4. Update webhook URL in LINE Console
# https://your-production-domain.com/api/webhook/line

# 5. Verify
curl https://your-production-domain.com/api/webhook/line
```

### Health Check

```bash
curl https://your-production-domain.com/api/webhook/line

# Should return:
{
  "status": "ok",
  "service": "LINE Webhook",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "secrets": {
    "channelSecret": "✅ Set",
    "accessToken": "✅ Set"
  }
}
```

---

## 📝 Monitoring & Logs

### View Production Logs

```bash
# Vercel logs
vercel logs --follow

# Or in Vercel Dashboard
# → Your Project → Deployments → Runtime Logs
```

### What to Monitor

- **Webhook success rate** - Should be 100%
- **Response time** - Should be <1 second
- **Error rate** - Should be 0%
- **Message delivery** - Users receive replies

### Alerting

Set up alerts for:
- Signature verification failures
- Message send failures
- High response times (>5s)
- Network errors to api.line.biz

---

## 🎓 Troubleshooting Flowchart

```
Webhook not received?
├─ Webhook URL not updated? → Update in LINE Console
├─ Webhook not enabled? → Enable in LINE Console
├─ ngrok tunnel died? → Restart ngrok
└─ Dev server crashed? → Check pnpm dev

Signature invalid?
├─ Using wrong secret? → Check LINE_CHANNEL_SECRET
├─ Didn't restart server? → pnpm dev again
└─ Request body modified? → Check if body is raw text

No message reply?
├─ Network error (api.line.biz)? → Need internet
├─ Wrong access token? → Check LINE_CHANNEL_ACCESS_TOKEN
├─ Message format wrong? → Check formatForecastMessage()
└─ User blocked bot? → User needs to add again
```

---

## ✅ Success Checklist

- [ ] Dev server running with LINE webhook
- [ ] ngrok or dev tunnel exposing locally
- [ ] Webhook URL updated in LINE Console
- [ ] Webhook shows ✓ in LINE Console
- [ ] Bot added as friend on LINE
- [ ] Received welcome message
- [ ] Text message test works
- [ ] Location message test works
- [ ] Console shows no errors
- [ ] Response time <2 seconds

**When all checks pass:** 🎉 Ready for production!

---

## 📞 Support

- **LINE Developers:** https://developers.line.biz/console/
- **LINE Messaging API Docs:** https://developers.line.biz/en/reference/messaging-api/
- **ngrok Docs:** https://ngrok.com/docs
- **Next.js Docs:** https://nextjs.org/docs

