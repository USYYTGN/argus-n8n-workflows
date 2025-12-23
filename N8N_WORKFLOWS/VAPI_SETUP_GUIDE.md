# 🤖 VAPI AI Müşteri Temsilcisi - Kurulum Kılavuzu

## 📋 İçindekiler
1. [Gereksinimler](#gereksinimler)
2. [Vapi Hesabı Kurulumu](#vapi-hesabı-kurulumu)
3. [Twilio Entegrasyonu](#twilio-entegrasyonu)
4. [n8n Workflow'ları](#n8n-workflowları)
5. [Test Etme](#test-etme)
6. [Özelleştirme](#özelleştirme)
7. [Sorun Giderme](#sorun-giderme)

---

## 🎯 Gereksinimler

### Hesaplar
- ✅ **Vapi Account** - https://vapi.ai
- ✅ **Twilio Account** - Zaten var
- ✅ **n8n** - Çalışır durumda
- ✅ **11Labs Account** (Opsiyonel) - Daha iyi ses kalitesi için

### API Keys
- Vapi API Key
- Twilio Account SID
- Twilio Auth Token
- OpenAI API Key (Vapi üzerinden)
- 11Labs API Key (Opsiyonel)

---

## 🚀 Vapi Hesabı Kurulumu

### 1. Vapi Hesabı Oluşturma
```bash
# 1. https://vapi.ai adresine git
# 2. Sign Up yap
# 3. Dashboard'a gir
```

### 2. API Key Alma
```bash
# Dashboard -> Settings -> API Keys
# "Create API Key" butonuna tıkla
# Key'i kopyala ve güvenli bir yere kaydet
```

### 3. Provider'ları Yapılandırma

#### OpenAI (AI Model için)
```
Dashboard -> Providers -> OpenAI
- API Key: sk-...
- Model: gpt-4-turbo veya gpt-4
```

#### 11Labs (Turkish Voice için)
```
Dashboard -> Providers -> 11Labs
- API Key: ...
- Voice ID: pNInz6obpgDQGcFmaJgB (Turkish - Adam)
```

#### Deepgram (Speech-to-Text için)
```
Dashboard -> Providers -> Deepgram
- API Key: ...
- Model: nova-2
- Language: tr (Turkish)
```

---

## 📞 Twilio Entegrasyonu

### Mevcut Twilio Bilgileriniz
Zaten Twilio hesabınız var. İhtiyacımız olan:

```
Account SID: ACxxxxxxxxxxxxxxxxxx
Auth Token: xxxxxxxxxxxxxxxx
Phone Number: +127223344653 (sizin numara)
```

### Twilio'yu Vapi'ye Bağlama

#### Option 1: n8n Workflow ile (Önerilen)
1. **VAPI_PHONE_NUMBER_SETUP.json** workflow'unu n8n'e import et
2. `Config Settings` node'unda bilgileri güncelle:
```javascript
{
  twilioAccountSid: 'ACxxxxxxxxxx', // Twilio SID
  twilioAuthToken: 'xxxxxxxxxxxxxxxx', // Twilio Auth Token
  twilioPhoneNumber: '+127223344653', // Twilio numaran
  vapiApiKey: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // Vapi API Key
  webhookBaseUrl: 'https://argusbot.duckdns.org/webhook'
}
```
3. Workflow'u çalıştır
4. Başarılı response gelecek

#### Option 2: Manuel (Vapi Dashboard'dan)
```
1. Vapi Dashboard -> Phone Numbers
2. "Add Phone Number" -> "Import from Twilio"
3. Twilio credentials'ları gir
4. Phone Number'ı seç
5. Webhook URL'i ayarla: https://argusbot.duckdns.org/webhook/vapi-customer-service
```

---

## 🔧 n8n Workflow'ları

### 1. Ana Workflow'u Import Etme

**VAPI_AI_CUSTOMER_SERVICE_MAIN.json**

Bu workflow şunları yapar:
- ✅ Gelen aramaları karşılar
- ✅ Vapi event'lerini işler
- ✅ Function call'ları yönetir
- ✅ Conversation'ları loglar

```bash
# n8n'de
1. Workflows -> Import from File
2. VAPI_AI_CUSTOMER_SERVICE_MAIN.json'u seç
3. Import
```

#### Webhook URL'lerini Kontrol Et
Workflow'daki webhook node'u aktive et:
```
Production URL: https://argusbot.duckdns.org/webhook/vapi-customer-service
```

Bu URL'i Vapi'ye kaydetmen gerekiyor.

### 2. Outbound Call Workflow

**VAPI_OUTBOUND_CALL.json**

Müşterileri aramak için:
```javascript
// Call Config node'unda
{
  customerPhoneNumber: '+905554443322', // Aranacak numara
  vapiApiKey: 'your-vapi-api-key',
  fromNumber: '+127223344653', // Twilio numaran
  firstMessage: 'Merhaba, ARGUS'tan arıyorum...'
}
```

Çalıştır -> Arama başlar!

### 3. Webhook ile Arama Başlatma

```bash
curl -X POST https://argusbot.duckdns.org/webhook/vapi-trigger-outbound \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+905554443322",
    "customerName": "Ali Yılmaz",
    "reason": "follow-up",
    "orderId": "ARG-12345",
    "firstMessage": "Merhaba Ali Bey, siparişiniz kargoya verildi."
  }'
```

---

## 🛠️ Özelleştirme

### System Prompt Değiştirme

**VAPI_AI_CUSTOMER_SERVICE_MAIN.json** -> `Build Assistant Config` node:

```javascript
systemPrompt: `
Sen ARGUS Müşteri Hizmetleri AI asistanısın.

Şirket Bilgileri:
- Adres: İstanbul, Türkiye
- Çalışma Saatleri: 7/24
- Email: info@argus.com
- Website: www.argus.com

Görevin:
- Müşterilere yardımcı olmak
- ...

Özel Kurallar:
- VIP müşterilere öncelik ver
- 1000 TL üzeri siparişlerde ücretsiz kargo bilgisi ver
- ...
`
```

### Custom Tool Ekleme

Yeni bir function eklemek için:

1. **Build Assistant Config** node'da tools array'ine ekle:
```javascript
{
  type: "function",
  function: {
    name: "checkInventory",
    description: "Ürün stok durumunu kontrol eder",
    parameters: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "Ürün ID"
        }
      },
      required: ["productId"]
    },
    async: true,
    url: "https://argusbot.duckdns.org/webhook/vapi-tool-inventory"
  }
}
```

2. **Route Function Calls** switch node'a condition ekle

3. Yeni bir Code node oluştur ve tool logic'ini yaz

4. Function result'ı Vapi'ye döndür

### Ses Ayarları

**11Labs Voice ID'leri:**
```javascript
// Erkek Sesler
"pNInz6obpgDQGcFmaJgB" // Adam (Turkish)
"EXAVITQu4vr4xnSDxMaL" // Sarah (English)

// Kadın Sesler
"21m00Tcm4TlvDq8ikWAM" // Rachel (English)
```

**Ses parametreleri:**
```javascript
voice: {
  provider: "11labs",
  voiceId: "pNInz6obpgDQGcFmaJgB",
  stability: 0.5,        // 0-1: Düşük = daha dinamik
  similarityBoost: 0.75, // 0-1: Yüksek = daha benzer
  speed: 1.0             // 0.5-2.0: Konuşma hızı
}
```

### CRM Entegrasyonu

Müşteri bilgilerini gerçek CRM'den çekmek için:

**Tool: Get Customer Info** node'unda:
```javascript
// Salesforce örneği
const axios = require('axios');
const customer = await axios.get(
  `https://api.salesforce.com/customers/${phoneNumber}`,
  { headers: { Authorization: 'Bearer YOUR_SF_TOKEN' } }
);

return [{
  json: {
    toolCallId: $json.toolCallId,
    result: {
      success: true,
      customer: customer.data
    }
  }
}];
```

---

## 🧪 Test Etme

### 1. Webhook Test
```bash
# Vapi webhook'unun çalıştığını test et
curl -X POST https://argusbot.duckdns.org/webhook/vapi-customer-service \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "assistant-request"
    },
    "call": {
      "id": "test-123"
    }
  }'
```

### 2. Inbound Call Test
1. Twilio numaranı ara: **+127223344653**
2. Vapi asistanı cevap vermeli
3. "Siparişimi kontrol etmek istiyorum" de
4. checkOrder function'ı çalışmalı

### 3. Outbound Call Test
1. **VAPI_OUTBOUND_CALL.json** workflow'unu aç
2. Call Config'de kendi numaranı yaz
3. Execute Workflow
4. Telefonun çalmalı

### 4. Tool Test

**Sipariş Sorgulama:**
```
Sen: "ARG-12345 numaralı siparişimi kontrol edebilir misin?"
AI: "ARG-12345 numaralı siparişiniz Kargoya verildi durumunda..."
```

**Ticket Oluşturma:**
```
Sen: "Ürün bozuk geldi, destek talebi açmak istiyorum"
AI: "Destek talebiniz oluşturuldu. Talep numaranız: TKT-12345678"
```

**FAQ:**
```
Sen: "Kargo ne zaman gelir?"
AI: "Standart kargolar 2-3 iş günü içinde teslim edilir..."
```

---

## 🎨 Dashboard & Analytics

### Call Logs Kaydetme

**Log Call End** node'unu bir veritabanına bağla:

```javascript
// PostgreSQL örneği
// n8n PostgreSQL node ekle

INSERT INTO call_logs (
  call_id,
  phone_number,
  duration,
  transcript,
  summary,
  cost,
  created_at
) VALUES (
  $json.callId,
  $json.phoneNumber,
  $json.duration,
  $json.transcript,
  $json.summary,
  $json.cost,
  NOW()
)
```

### Real-time Monitoring

**Log Transcript** node'unu WebSocket'e bağla:
```javascript
// Real-time transcript'i frontend'e gönder
const io = require('socket.io-client');
const socket = io('https://your-dashboard.com');

socket.emit('transcript', {
  callId: $json.callId,
  text: $json.transcriptText,
  role: $json.role,
  timestamp: $json.timestamp
});
```

---

## ❗ Sorun Giderme

### Vapi Cevap Vermiyor

**Kontrol:**
1. Vapi Dashboard -> Phone Numbers -> Status = Active ✅
2. Webhook URL doğru mu?
3. n8n workflow aktif mi?
4. Provider'lar (OpenAI, 11Labs, Deepgram) aktif mi?

**Log:**
```bash
# n8n executions'a bak
# Vapi Dashboard -> Calls -> Log'a bak
```

### Ses Gelmiyor / TTS Çalışmıyor

**Kontrol:**
1. 11Labs API key doğru mu?
2. Voice ID geçerli mi?
3. 11Labs quota'n doldu mu?

**Alternative:**
```javascript
// Azure TTS kullan (daha ucuz)
voice: {
  provider: "azure",
  voiceId: "tr-TR-AhmetNeural"
}
```

### STT (Speech-to-Text) Türkçe Algılamıyor

**Kontrol:**
```javascript
transcriber: {
  provider: "deepgram",
  model: "nova-2",
  language: "tr" // ✅ Mutlaka "tr" olmalı
}
```

**Alternative:**
```javascript
// Whisper kullan (daha iyi Türkçe)
transcriber: {
  provider: "openai",
  model: "whisper-1",
  language: "tr"
}
```

### Function Call Çalışmıyor

**Debug:**
1. `Route Function Calls` switch node'unda breakpoint koy
2. `functionName` değerini kontrol et
3. Webhook URL'leri çalışıyor mu test et

```bash
# Tool webhook'u test et
curl -X POST https://argusbot.duckdns.org/webhook/vapi-customer-service \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "function-call",
      "functionCall": {
        "name": "checkOrder",
        "parameters": {
          "orderNumber": "ARG-12345"
        }
      },
      "toolCallId": "test-123"
    }
  }'
```

### Arama Hemen Kapanıyor

**Sebep:**
- `maxDurationSeconds` çok düşük
- `endCallPhrases` yanlışlıkla tetikleniyor
- Model yanıt veremiyor (timeout)

**Çözüm:**
```javascript
maxDurationSeconds: 600, // 10 dakika

endCallPhrases: [
  "tamam görüşürüz",
  "hoşçakal",
  "kapat şimdi"
  // Çok genel ifadeler ekleme!
]
```

---

## 💰 Maliyet Optimizasyonu

### Model Seçimi
```javascript
// Daha ucuz ama yine de iyi:
model: {
  provider: "openai",
  model: "gpt-3.5-turbo", // 10x daha ucuz
  temperature: 0.7
}

// En iyi kalite:
model: {
  provider: "openai",
  model: "gpt-4-turbo"
}
```

### TTS Provider
```javascript
// En ucuz: Azure
voice: {
  provider: "azure",
  voiceId: "tr-TR-AhmetNeural"
}

// En iyi: 11Labs
voice: {
  provider: "11labs",
  voiceId: "pNInz6obpgDQGcFmaJgB"
}

// Orta: Google
voice: {
  provider: "google",
  voiceId: "tr-TR-Standard-B"
}
```

### STT Provider
```javascript
// En ucuz: Deepgram
transcriber: {
  provider: "deepgram",
  model: "nova-2"
}

// En iyi: Whisper
transcriber: {
  provider: "openai",
  model: "whisper-1"
}
```

---

## 📊 Metrikler

### Takip Edilmesi Gerekenler
- ✅ Total Calls (günlük/haftalık/aylık)
- ✅ Average Call Duration
- ✅ Customer Satisfaction Score
- ✅ Resolution Rate (çözülen/çözülemeyen)
- ✅ Cost per Call
- ✅ Most Used Functions
- ✅ Peak Call Times

### Dashboard Örneği

Google Sheets veya Airtable'a log at:
```javascript
// Her call sonunda
{
  date: '2025-12-17',
  callId: 'call-123',
  duration: 245, // saniye
  cost: 0.35, // USD
  resolved: true,
  functions_used: ['checkOrder', 'createTicket'],
  customer_phone: '+905554443322',
  satisfaction: 5 // 1-5
}
```

---

## 🎓 İleri Seviye

### Multi-language Support
```javascript
// Dil algılama
transcriber: {
  provider: "deepgram",
  model: "nova-2",
  language: "multi" // Auto-detect
}

// System prompt'ta
systemPrompt: `
Müşteri Türkçe konuşuyorsa Türkçe, İngilizce konuşuyorsa İngilizce cevap ver.
`
```

### Sentiment Analysis
```javascript
// Function: analyzeSentiment
{
  name: "analyzeSentiment",
  description: "Müşteri duygusal durumunu analiz eder",
  // Negatif sentiment -> Insan'a yönlendir
}
```

### Call Recording
```javascript
// Vapi otomatik kaydeder
// Dashboard -> Calls -> Recording URL
```

### A/B Testing
```javascript
// Farklı system prompt'ları test et
// Farklı voice'ları test et
// Conversion rate'e bak
```

---

## 📞 Destek

Sorun yaşarsan:
1. n8n execution logs'a bak
2. Vapi Dashboard -> Calls -> Error logs
3. GitHub Issues: https://github.com/vapi-ai/vapi-issues

---

## ✅ Checklist

Setup tamamlandı mı?

- [ ] Vapi hesabı oluşturuldu
- [ ] API Key alındı
- [ ] Provider'lar yapılandırıldı (OpenAI, 11Labs, Deepgram)
- [ ] Twilio Vapi'ye bağlandı
- [ ] n8n workflow'ları import edildi
- [ ] Webhook URL'leri ayarlandı
- [ ] Test araması yapıldı ✅
- [ ] Outbound call test edildi ✅
- [ ] Function call'lar çalışıyor ✅
- [ ] Logging aktif
- [ ] Production'a alındı 🚀

---

**Hazırsın! 🎉**

Müşterilerini ara veya onların seni aramasını bekle. AI müşteri temsilcin artık 7/24 aktif!

**Not:** Production'a almadan önce mutlaka kapsamlı test yap. Gerçek müşterilerle test etmeden önce arkadaşlarınla dene.
