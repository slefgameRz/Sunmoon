# 🔧 LINE Signature Mismatch - Diagnostic Guide

**Error:**
```
❌ Signature mismatch
Expected: 0TVn2eKoL5wMSR2CDLzEKxCU+CubmB6s58tA5y2mVHk=
Got: EvkGZPdYzMf+eqFMspHbiuUneN4XhMP3UwKe5Xc43T4=
```

---

## 🎯 Quick Diagnosis

### Step 1: Verify Channel Secret in LINE Console

1. Go to [LINE Developers Console](https://developers.line.biz/console/)
2. Select your channel
3. Go to **Messaging API** tab
4. Scroll to **Channel Secret**
5. Copy the exact value (including any special characters)
6. Compare with `LINE_CHANNEL_SECRET` in `.env.local`

**Current value in `.env.local`:**
```
LINE_CHANNEL_SECRET=c2539c8acbedb3e93e469eca415ffdbd
```

**If different:**
```bash
# Update .env.local with the correct value from LINE Console
LINE_CHANNEL_SECRET=<paste_exact_value_from_console>

# Then restart dev server
pnpm dev
```

---

### Step 2: Check if Real LINE is Sending Requests

The signature mismatch shows **two different values**, which means:

✅ **Webhook IS receiving requests** (otherwise no signature would be sent)
❌ **But the secret doesn't match**

This could mean:

| Scenario | Solution |
|----------|----------|
| **Using wrong secret** | Copy correct secret from LINE Console |
| **Recently rotated secret** | Restart dev server to load new `.env.local` |
| **Secret has typo** | Double-check for spaces or special characters |
| **Multiple channels** | Make sure you're looking at correct channel |
| **Testing locally vs production** | Each has different secrets |

---

### Step 3: Verify You're Using Correct Channel

```bash
# In LINE Console, verify:
✅ Provider exists
✅ Channel created (type: Messaging API)
✅ Channel is ACTIVE
✅ Channel ID matches: 2008345981
✅ Secret shown in console matches .env.local
```

---

## 🔍 How LINE Signature Works

**LINE signs every webhook request with HMAC-SHA256:**

```
1. LINE has your Channel Secret (from console)
2. LINE creates message body (JSON)
3. LINE calculates: HMAC-SHA256(body, secret) → base64
4. LINE sends:
   - Header: x-line-signature = <base64_hash>
   - Body: JSON message

5. Your webhook receives both
6. Your webhook calculates: HMAC-SHA256(body, your_secret) → base64
7. Your webhook compares:
   - Header signature == Your calculation
   - ✅ Match = Accept (from real LINE)
   - ❌ Mismatch = Reject (fake/modified)
```

**If signatures don't match:**
- LINE's secret ≠ Your secret
- Body was modified after transmission
- Wrong algorithm used (but we use SHA256 which is correct)

---

## ✅ Solution Checklist

### Quick Fix (Most Common)

```bash
# 1. Copy the EXACT secret from LINE Console
# Go to: https://developers.line.biz/console/
# → Your Channel → Messaging API → Channel Secret

# 2. Update .env.local
LINE_CHANNEL_SECRET=<paste_exactly_as_shown>

# 3. Save file

# 4. Restart dev server
# Stop: Ctrl+C in terminal
# Start: pnpm dev

# 5. Test again by sending message from LINE app
```

---

### Verification Steps

**After updating `.env.local`:**

1. **Check health endpoint:**
   ```bash
   curl http://localhost:3000/api/webhook/line
   
   # Should show:
   # {
   #   "status": "ok",
   #   "secrets": {
   #     "channelSecret": "✅ Set",
   #     "accessToken": "✅ Set"
   #   }
   # }
   ```

2. **Watch console for the next webhook:**
   ```
   📨 Webhook received
   Signature header: ✅ Present
   ✅ Signature verified        ← This line should appear
   📝 Processing text message
   ```

3. **Test from LINE app:**
   - Send: "ทำนายน้ำ ภูเก็ต"
   - Watch console for ✅ (not ❌)

---

## 🧪 Manual Testing (Curl)

If you want to test manually with curl to verify your secret:

### Generate Correct Signature

**File: `test-signature.js`**

```javascript
const crypto = require('crypto');

// Use the EXACT secret from LINE Console
const secret = 'c2539c8acbedb3e93e469eca415ffdbd'; // ← Replace with your actual secret

// Create a simple test payload
const payload = JSON.stringify({
  events: [{
    type: "message",
    message: {
      type: "text",
      text: "ทำนายน้ำ ภูเก็ต"
    },
    replyToken: "nHuyWiB7yP5Zw52FIkcQT",
    source: { userId: "U206d25c2ea6bd87c17655609a1c37cb8" },
    timestamp: 1462629479859
  }]
});

// Generate signature
const signature = crypto
  .createHmac('SHA256', secret)
  .update(payload)
  .digest('base64');

console.log('Payload:');
console.log(payload);
console.log('\nSignature:');
console.log(signature);
console.log('\nCurl command:');
console.log(`curl -X POST http://localhost:3000/api/webhook/line \\
  -H "Content-Type: application/json" \\
  -H "X-Line-Signature: ${signature}" \\
  -d '${payload}'`);
```

**Run it:**
```bash
node test-signature.js
```

**Then copy-paste the curl command from output:**
```bash
curl -X POST http://localhost:3000/api/webhook/line \
  -H "Content-Type: application/json" \
  -H "X-Line-Signature: <generated_signature>" \
  -d '<payload>'
```

**Expected result in console:**
```
✅ Signature verified
```

---

## ⚠️ Common Mistakes

### ❌ Mistake 1: Copy-Pasting Wrong Secret

**Wrong:**
```
Channel ID:       2008345981
Channel Secret:   c2539c8acbedb3e93e469eca415ffdbd  ← Wrong place
```

**Right:**
- Go to **Messaging API** tab
- Look for **Channel Secret** specifically (not Channel ID)
- Copy the long hex string

---

### ❌ Mistake 2: Not Restarting Dev Server

After changing `.env.local`:

```bash
# ❌ Wrong - changes not loaded
# pnpm dev  ← Still running with old value

# ✅ Right - restart to load new value
Ctrl+C  ← Stop
pnpm dev  ← Start again
```

---

### ❌ Mistake 3: Multiple Channels Confusion

If you have multiple channels:

```
Provider
├─ Channel 1 (Secret: abc123...)
├─ Channel 2 (Secret: def456...)  ← Make sure you're using THIS one
└─ Channel 3 (Secret: ghi789...)
```

Check that:
1. You're sending from correct bot (Channel 2)
2. You have correct secret for Channel 2 in `.env.local`
3. Webhook URL points to correct domain

---

### ❌ Mistake 4: Special Characters

Some secrets contain special characters. Make sure to:

```bash
# ✅ Copy exactly including special characters
LINE_CHANNEL_SECRET=abc+123/def==

# ❌ Don't remove or modify
LINE_CHANNEL_SECRET=abc123def    ← Missing +, /, =
```

---

## 🔄 If Still Not Working

### Debug Steps

1. **Add extra logging:**

   Edit `app/api/webhook/line/route.ts`:

   ```typescript
   function verifySignature(body: string, signature: string): boolean {
     if (!CHANNEL_SECRET) {
       console.error('❌ LINE_CHANNEL_SECRET is not configured')
       console.error('CHANNEL_SECRET env value:', process.env.LINE_CHANNEL_SECRET)
       return false
     }

     console.log('🔍 Debugging signature verification:')
     console.log('Secret length:', CHANNEL_SECRET.length)
     console.log('Secret (first 10 chars):', CHANNEL_SECRET.substring(0, 10))
     console.log('Body length:', body.length)
     console.log('Body preview:', body.substring(0, 100))
     
     const hash = crypto
       .createHmac('SHA256', CHANNEL_SECRET)
       .update(body)
       .digest('base64')

     console.log('Expected signature:', signature)
     console.log('Calculated signature:', hash)

     return hash === signature
   }
   ```

2. **Check console output** - The debug info will show what's being compared

3. **Verify in LINE Console:**
   - Go to **Messaging API** → **Webhook Settings**
   - URL shows: `https://your-domain/api/webhook/line`
   - Status should show ✅ green checkmark

---

## 📞 LINE Console Verification

### Where to Find Channel Secret

```
https://developers.line.biz/console/
   ↓
Select Provider
   ↓
Select Channel (Messaging API)
   ↓
Go to "Messaging API" tab
   ↓
Scroll down to "Channel Secret"
   ↓
Copy the value (looks like: abc123def456ghi789jkl...)
```

### Verify Webhook Status

```
Same location:
   ↓
Look for "Webhook Settings"
   ↓
Check:
   ✅ Webhook is ENABLED
   ✅ Webhook URL is correct
   ✅ Use signature verification is CHECKED
```

---

## ✅ Success Signs

When signature verification works:

```
console output should show:
✅ Signature verified
📝 Processing text message
📍 Parsed location: {...}
📤 Sending 1 message(s) to LINE
✅ Message sent successfully
```

---

## 🎯 Next Steps

1. **Verify secret in LINE Console** (5 minutes)
2. **Update `.env.local`** with correct value (1 minute)
3. **Restart dev server** - `pnpm dev` (30 seconds)
4. **Test from LINE app** - Send "ทำนายน้ำ ภูเก็ต" (1 minute)
5. **Watch console** - Should see ✅ Signature verified

**Time to fix:** ~10 minutes max

---

## 📚 Reference

**LINE Documentation:**
- [Webhook Signature Verification](https://developers.line.biz/en/docs/messaging-api/webhooks/#signature-verification)
- [Getting Channel Secret](https://developers.line.biz/en/docs/messaging-api/getting-started/)

**Your Setup:**
- Channel ID: `2008345981`
- Current Secret: `c2539c8acbedb3e93e469eca415ffdbd` (verify this matches console)
- Webhook URL: `https://your-ngrok-domain/api/webhook/line`

