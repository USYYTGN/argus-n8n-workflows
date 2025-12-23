# 🚀 Vapi AI Müşteri Hizmetleri - Hızlı Başlangıç

## ✅ Hazırlık

Vapi workflow'larını kullanmak için gerekli olan:

1. **n8n** - Workflow automation platformu
2. **Vapi Account** - AI telefon asistanı servisi
3. **Twilio Account** - Telefon numarası (zaten var)

## 📦 n8n Kurulumu

### Option 1: Docker ile (Önerilen)

```bash
# n8n'yi Docker ile çalıştır
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# n8n'nin çalıştığını kontrol et
curl http://localhost:5678
```

### Option 2: NPM ile

```bash
# n8n'yi global olarak yükle
npm install -g n8n

# n8n'yi başlat
n8n start

# Tarayıcıda aç: http://localhost:5678
```

## 🔧 Workflow Import

1. **n8n arayüzünü aç**: http://localhost:5678

2. **Workflows** menüsüne git

3. **Import from File** seç

4. Şu workflow'ları import et:
   - `N8N_WORKFLOWS/VAPI_AI_CUSTOMER_SERVICE_MAIN_FIXED.json` - Ana müşteri hizmetleri
   - `N8N_WORKFLOWS/VAPI_OUTBOUND_CALL.json` - Dışarı arama (opsiyonel)
   - `N8N_WORKFLOWS/VAPI_PHONE_NUMBER_SETUP.json` - Telefon setup (opsiyonel)

## 🎯 Vapi Hesabı Kurulumu

### 1. Vapi Hesabı Oluştur

1. https://vapi.ai adresine git
2. Sign up yap
3. Dashboard'a gir

### 2. API Key Al

1. Dashboard → Settings → API Keys
2. "Create API Key" tıkla
3. Key'i kopyala ve kaydet

### 3. Provider'ları Yapılandır

#### OpenAI (AI Model)
```
Dashboard → Providers → OpenAI
- API Key: sk-...
- Model: gpt-4-turbo
```

#### 11Labs (Türkçe Ses)
```
Dashboard → Providers → 11Labs
- API Key: ...
- Voice ID: pNInz6obpgDQGcFmaJgB (Türkçe)
```

#### Deepgram (Konuşma → Metin)
```
Dashboard → Providers → Deepgram
- API Key: ...
- Model: nova-2
- Language: tr
```

## 🔗 n8n Workflow Ayarları

### Ana Workflow: VAPI_AI_CUSTOMER_SERVICE_MAIN_FIXED

1. Workflow'u aç

2. **"Build Assistant Config"** node'unu aç

3. Environment variable ekle veya doğrudan kod içinde güncelle:

```javascript
// En üstteki jsCode içinde, şu satırı bul ve güncelle:
url: $env.WEBHOOK_URL + "webhook/vapi-tool-checkorder"

// Eğer environment variable yoksa, direkt URL yaz:
url: "https://argusbot.duckdns.org/webhook/vapi-tool-checkorder"
```

4. **Webhook URL'ini Not Et**:
   - Workflow'daki webhook node'unu aktive et
   - Production URL'i kopyala (örn: `https://argusbot.duckdns.org/webhook/vapi-customer-service`)

## 📞 Twilio → Vapi Bağlantısı

### Option 1: Vapi Dashboard'dan (En Kolay)

1. Vapi Dashboard → Phone Numbers
2. "Add Phone Number" → "Import from Twilio"
3. Twilio credentials gir:
   - Account SID: `ACxxxxxxxxxx`
   - Auth Token: `xxxxxxxx`
4. Phone number seç: `+127223344653`
5. Webhook URL ayarla: n8n webhook URL'ini yapıştır

### Option 2: n8n Workflow ile

1. **VAPI_PHONE_NUMBER_SETUP.json** workflow'unu import et
2. Config node'unda bilgileri güncelle
3. Execute yap

## ✅ Test

### Basit Test

1. Ana workflow'u aktive et (sağ üstteki toggle)
2. Twilio numaranı ara: **+127223344653**
3. AI asistan cevap vermeli!

### Test Komutları

Aradığında şunları söyle:

```
"Siparişimi kontrol etmek istiyorum"
→ Sipariş sorgulama fonksiyonu çalışır

"ARG-12345 numaralı siparişim nerede?"
→ Belirli sipariş sorgulanır

"Destek talebi açmak istiyorum"
→ Ticket oluşturma fonksiyonu çalışır

"Kargo ne zaman gelir?"
→ FAQ fonksiyonu çalışır
```

## 🎨 Özelleştirme

### System Prompt Değiştir

`Build Assistant Config` node → `jsCode` içinde `systemPrompt` bölümünü düzenle.

### Yeni Fonksiyon Ekle

1. `tools` array'ine yeni fonksiyon ekle
2. `Switch: Function` node'a yeni case ekle
3. Yeni tool node oluştur

Detaylı talimatlar için: `N8N_WORKFLOWS/VAPI_SETUP_GUIDE.md`

## 🐛 Sorun Giderme

### Vapi Cevap Vermiyor

- Vapi Dashboard → Phone Numbers → Status kontrol et
- n8n workflow aktif mi?
- Provider'lar (OpenAI, 11Labs) aktif mi?

### Webhook Hatası

- n8n workflow çalışıyor mu?
- Webhook URL doğru mu?
- Firewall/HTTPS ayarları tamam mı?

### Fonksiyon Çağrıları Çalışmıyor

- n8n execution logs kontrol et
- Tool URL'leri doğru mu?
- Vapi'de function calling aktif mi?

## 📊 Sonraki Adımlar

1. ✅ Workflow'u import et
2. ✅ Vapi hesabı oluştur
3. ✅ Provider'ları yapılandır
4. ✅ Twilio'yu bağla
5. ✅ Test et
6. 🎯 Production'a al!

---

**Yardım**

- Detaylı setup: `N8N_WORKFLOWS/VAPI_SETUP_GUIDE.md`
- Vapi Docs: https://docs.vapi.ai
- n8n Docs: https://docs.n8n.io

**Başarılar!** 🎉
