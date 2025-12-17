# 🚀 VAPI AI Müşteri Temsilcisi - Hızlı Başlangıç

## ⚡ 5 Dakikada Başla

### 1️⃣ Vapi Hesabı Oluştur
```bash
1. https://vapi.ai → Sign Up
2. Dashboard → API Keys → Create API Key
3. API Key'i kopyala
```

### 2️⃣ Provider'ları Ekle

**OpenAI (AI için):**
```
Dashboard → Providers → OpenAI
API Key: sk-...
```

**11Labs (Türkçe Ses için):**
```
Dashboard → Providers → 11Labs
API Key: ...
Voice: Turkish (Adam) - pNInz6obpgDQGcFmaJgB
```

**Deepgram (Konuşma Algılama için):**
```
Dashboard → Providers → Deepgram
API Key: ...
Model: nova-2
Language: tr
```

### 3️⃣ Twilio'yu Bağla

**n8n'de:**
1. `VAPI_PHONE_NUMBER_SETUP.json` workflow'unu import et
2. `Config Settings` node'unu aç
3. Bilgileri doldur:
```javascript
{
  twilioAccountSid: 'ACxxxxxx',
  twilioAuthToken: 'xxxxxx',
  twilioPhoneNumber: '+127223344653',
  vapiApiKey: 'xxxxxx'
}
```
4. Execute Workflow ▶️

### 4️⃣ Ana Workflow'u Aktive Et

1. `VAPI_AI_CUSTOMER_SERVICE_MAIN.json` import et
2. Webhook node'u aktive et
3. Webhook URL'i kopyala:
   ```
   https://argusbot.duckdns.org/webhook/vapi-customer-service
   ```
4. Vapi Dashboard → Phone Numbers → Webhook URL'i yapıştır

### 5️⃣ Test Et!

**Inbound (Gelen Arama):**
```
Twilio numaranı ara: +127223344653
AI seni karşılayacak! 🎉
```

**Outbound (Giden Arama):**
```bash
1. VAPI_OUTBOUND_CALL.json import et
2. Call Config → customerPhoneNumber: '+905xxxxxxxxx'
3. Execute ▶️
4. Telefonun çalar! 📞
```

---

## 🎯 İlk Konuşma Senaryosu

### Test Diyalogu:

```
🤖 AI: Merhaba, ARGUS müşteri hizmetlerine hoş geldiniz.
       Size nasıl yardımcı olabilirim?

👤 Sen: Siparişimi kontrol etmek istiyorum.

🤖 AI: Tabii, sipariş numaranız nedir?

👤 Sen: ARG-12345

🤖 AI: ARG-12345 numaralı siparişiniz Kargoya verildi durumunda.
       Kargo takip numarası: TRK123456789
       Tahmini teslimat: 20 Aralık 2025
       Başka bir konuda yardımcı olabilir miyim?

👤 Sen: Hayır teşekkürler.

🤖 AI: ARGUS'u aradığınız için teşekkürler, iyi günler!
```

---

## 📋 Özelleştirme (3 Dakika)

### System Prompt Değiştir

`VAPI_AI_CUSTOMER_SERVICE_MAIN.json` → `Build Assistant Config` node:

```javascript
systemPrompt: `
Sen [ŞİRKET ADIN] müşteri hizmetleri asistanısın.

Şirket Bilgileri:
- İsim: [ŞİRKET ADIN]
- Sektör: [SEKTÖRÜN]
- Çalışma Saatleri: 7/24

Görevin:
- [GÖREV 1]
- [GÖREV 2]
...
`
```

### İlk Mesajı Değiştir

```javascript
firstMessage: "Merhaba, [ŞİRKET ADIN] müşteri hizmetlerine hoş geldiniz!"
```

### Veda Mesajını Değiştir

```javascript
endCallMessage: "[ŞİRKET ADIN]'ı seçtiğiniz için teşekkürler!"
```

---

## 🔧 Fonksiyonlar

Hazır fonksiyonlar:

### ✅ checkOrder
Sipariş durumu sorgula
```
"Siparişimi kontrol et" → Sipariş bilgilerini döndürür
```

### ✅ createTicket
Destek talebi oluştur
```
"Ürün bozuk geldi" → Ticket oluşturur
```

### ✅ getCustomerInfo
Müşteri bilgisi getir
```
Otomatik olarak arayan kişinin bilgisini çeker
```

### ✅ getFAQ
Sık sorulan sorular
```
"Kargo ne zaman gelir?" → FAQ'den cevap verir
```

---

## 💾 Veritabanı Bağlama (Opsiyonel)

Gerçek verilerle çalışmak için:

### PostgreSQL Örneği

`Tool: Check Order` node'unda:

```javascript
// Mock data yerine PostgreSQL query
const order = await $('PostgreSQL').getRow({
  table: 'orders',
  where: {
    orderNumber: params.orderNumber
  }
});

return [{
  json: {
    toolCallId: $json.toolCallId,
    result: {
      success: true,
      order: order
    }
  }
}];
```

n8n'e PostgreSQL node ekle:
```
1. Credentials → Add Credential → PostgreSQL
2. Host, Database, User, Password gir
3. Test Connection ✅
```

---

## 📊 Analytics Ekle (5 Dakika)

### Google Sheets'e Log

`Log Call End` node'undan sonra **Google Sheets** node ekle:

```
Operation: Append
Spreadsheet: Call Logs
Sheet: Sheet1

Columns:
- Call ID: {{ $json.callId }}
- Phone: {{ $json.phoneNumber }}
- Duration: {{ $json.duration }}
- Cost: {{ $json.cost }}
- Date: {{ $json.timestamp }}
```

---

## ⚙️ Production Hazırlık

### Rate Limiting Ekle

Call flood'u önlemek için:

```javascript
// Parse Vapi Event node'undan önce
const redis = require('redis');
const phoneNumber = $json.phoneNumber;

// Aynı numaradan 1 saatte max 10 call
const callCount = await redis.get(`calls:${phoneNumber}:1h`);
if (callCount > 10) {
  throw new Error('Rate limit exceeded');
}
```

### Error Handling

Her node'a **On Error** workflow bağla:
```
Settings → Error Workflow → [Error Handler Workflow]
```

### Backup

Workflow'ları export et:
```bash
# n8n'de
Workflows → Select All → Export
→ VAPI_WORKFLOWS_BACKUP_$(date).json
```

---

## 🐛 Hızlı Sorun Giderme

### Ses gelmiyor?
```javascript
// 11Labs yerine Azure dene
voice: {
  provider: "azure",
  voiceId: "tr-TR-AhmetNeural"
}
```

### Türkçe algılamıyor?
```javascript
// Whisper kullan
transcriber: {
  provider: "openai",
  model: "whisper-1",
  language: "tr"
}
```

### Function call çalışmıyor?
```bash
# Webhook'u manuel test et
curl -X POST https://argusbot.duckdns.org/webhook/vapi-customer-service \
  -H "Content-Type: application/json" \
  -d '{"message":{"type":"function-call","functionCall":{"name":"checkOrder","parameters":{"orderNumber":"ARG-12345"}}}}'
```

---

## 📱 Webhook ile Arama Başlat

API'den veya başka bir workflow'dan arama başlat:

```bash
curl -X POST https://argusbot.duckdns.org/webhook/vapi-trigger-outbound \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+905554443322",
    "customerName": "Ali Yılmaz",
    "reason": "Sipariş teyidi",
    "firstMessage": "Merhaba Ali Bey, siparişinizi teyit etmek için arıyorum."
  }'
```

Python'dan:
```python
import requests

requests.post(
    'https://argusbot.duckdns.org/webhook/vapi-trigger-outbound',
    json={
        'phoneNumber': '+905554443322',
        'customerName': 'Ali Yılmaz',
        'reason': 'follow-up',
        'orderId': 'ARG-12345'
    }
)
```

---

## 🎓 Sonraki Adımlar

1. ✅ Test aramaları yap
2. ✅ System prompt'u şirketine göre özelleştir
3. ✅ Gerçek veritabanına bağla
4. ✅ Analytics dashboard'u kur
5. ✅ Production'a al 🚀

---

## 📚 Daha Fazla Bilgi

Detaylı kılavuz için:
```
→ VAPI_SETUP_GUIDE.md
```

Vapi Docs:
```
→ https://docs.vapi.ai
```

---

**Hadi başla! 🚀**

Herhangi bir sorun olursa:
- n8n execution logs
- Vapi Dashboard → Calls
- GitHub Issues
