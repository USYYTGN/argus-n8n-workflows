# 🤖 ARGUS n8n Workflows

ARGUS için geliştirilmiş n8n workflow koleksiyonu ve AI müşteri hizmetleri sistemi.

## 📁 İçerik

### 🎯 AI Müşteri Temsilcisi (VAPI)
**Yeni! 🚀** Vapi + Twilio ile 7/24 çalışan AI müşteri hizmetleri sistemi.

#### Workflow'lar:
- **VAPI_AI_CUSTOMER_SERVICE_MAIN.json** - Ana müşteri hizmetleri workflow'u
  - Gelen aramaları karşılar
  - Function calling ile sipariş sorgulama, ticket oluşturma
  - Conversation logging
  - Real-time analytics

- **VAPI_PHONE_NUMBER_SETUP.json** - Twilio numarasını Vapi'ye bağlama
- **VAPI_OUTBOUND_CALL.json** - Müşterileri otomatik arama

#### Özellikler:
✅ Türkçe konuşma desteği (11Labs Turkish voice)
✅ Sipariş sorgulama
✅ Destek talebi oluşturma
✅ Müşteri bilgisi lookup
✅ FAQ sistemi
✅ Real-time conversation logging
✅ Webhook entegrasyonları
✅ CRM bağlantısı hazır (opsiyonel)

#### Hızlı Başlangıç:
```bash
# 1. VAPI hesabı oluştur (https://vapi.ai)
# 2. Quickstart guide'ı oku
cat VAPI_QUICKSTART.md

# 3. Workflow'ları n8n'e import et
# 4. .env.vapi.example'ı .env.vapi olarak kopyala
cp .env.vapi.example .env.vapi

# 5. Değişkenleri doldur
nano .env.vapi

# 6. Test et!
```

📖 **Detaylı Dokümantasyon:**
- [Hızlı Başlangıç](VAPI_QUICKSTART.md) - 5 dakikada başla
- [Kurulum Kılavuzu](N8N_WORKFLOWS/VAPI_SETUP_GUIDE.md) - Detaylı setup

---

### 🎤 Voice Agent (Claude)
**ARGUS_VOICE_AGENT_STABLE.json**
Claude Sonnet 4.5 ile çalışan telefon asistanı (Twilio entegreli)

---

### 📞 Twilio Aramaları
**TWILIO ARAMA (4).json**
Twilio ile outbound call başlatma

---

### 🧠 Memory & Core
**ARGUS Memory Core.json**
Konuşma hafızası ve context yönetimi

---

### 🔧 Tools & Utilities
- **TOOL_fix_n8n_code.json** - n8n kod fixer
- **tamirci.json** - Debug & repair workflow
- **ARGUS_BUILDER_TEST.json** - Workflow test suite

---

### 📊 Automation Workflows
- **ARGUS auto_ youtube'da son 24 saatte en ço.json** - YouTube trending tracker
- **ARGUS auto_ btc fiyatını her gün 17_15 te.json** - Bitcoin fiyat bildirimi
- **ANAFLOW.json** - Ana otomasyon akışı
- **ÜRETİM HATTI.json** - Production pipeline

---

### 📺 Integrations
- **YOU TUBE.json** - YouTube API entegrasyonu
- **Derinsu (2).json** - Custom integration

---

## 🚀 Kurulum

### Gereksinimler
- n8n (self-hosted veya cloud)
- Twilio hesabı
- Vapi hesabı (AI müşteri hizmetleri için)
- API Keys:
  - OpenAI
  - Anthropic (Claude için)
  - 11Labs (opsiyonel, ses için)
  - Deepgram (opsiyonel, STT için)

### Adımlar

1. **Repository'yi klonla**
```bash
git clone https://github.com/USYYTGN/argus-n8n-workflows.git
cd argus-n8n-workflows
```

2. **Environment variables'ları ayarla**
```bash
cp .env.vapi.example .env.vapi
nano .env.vapi
# API key'leri doldur
```

3. **n8n'de workflow'ları import et**
```
n8n → Workflows → Import from File
→ N8N_WORKFLOWS/*.json dosyalarını seç
```

4. **Credentials'ları yapılandır**
- Twilio
- Vapi
- OpenAI / Anthropic
- 11Labs (opsiyonel)
- PostgreSQL / MongoDB (opsiyonel)

5. **Webhook URL'lerini ayarla**
```
Vapi Dashboard → Phone Numbers → Server URL
→ https://your-n8n-instance.com/webhook/vapi-customer-service
```

6. **Test et!**
```bash
# Test araması
# Twilio numaranı ara veya outbound workflow'u çalıştır
```

---

## 🔐 Güvenlik

**ÖNEMLİ:**
- ❌ `.env.vapi` dosyasını asla commit etmeyin
- ❌ API key'leri paylaşmayın
- ✅ Production'da environment variables kullanın
- ✅ Webhook'lara signature verification ekleyin
- ✅ Rate limiting aktif edin

`.gitignore` dosyası zaten şunları içeriyor:
```
.env*
!.env.example
*.log
credentials.json
```

---

## 📊 Kullanım İstatistikleri

### AI Müşteri Hizmetleri
- ⚡ 7/24 aktif
- 🌍 Türkçe & İngilizce destek
- 📞 Sınırsız eşzamanlı arama
- 💰 ~$0.20-0.50 per call (ortalama 3 dakika)

### Özellikler
- 🔍 Sipariş sorgulama
- 🎫 Ticket oluşturma
- 👤 Müşteri tanıma
- 💬 FAQ sistemi
- 📝 Conversation logging
- 📊 Analytics dashboard

---

## 🛠️ Özelleştirme

### System Prompt Değiştirme
```javascript
// VAPI_AI_CUSTOMER_SERVICE_MAIN.json
// Build Assistant Config node

systemPrompt: `
Sen [ŞİRKET ADIN] müşteri hizmetleri asistanısın.
...
`
```

### Yeni Function Ekleme
1. `Build Assistant Config` → tools array'e ekle
2. `Route Function Calls` → yeni condition ekle
3. Yeni Code node oluştur
4. Function logic'ini yaz

Örnek: [VAPI_SETUP_GUIDE.md](N8N_WORKFLOWS/VAPI_SETUP_GUIDE.md#özelleştirme)

---

## 📈 Roadmap

- [ ] Multi-language support (EN, TR, DE)
- [ ] Sentiment analysis
- [ ] Advanced analytics dashboard
- [ ] CRM integrations (Salesforce, HubSpot)
- [ ] WhatsApp integration
- [ ] Email support integration
- [ ] Knowledge base RAG system

---

## 🐛 Sorun Giderme

### Vapi cevap vermiyor
```bash
# 1. Webhook URL'i kontrol et
# 2. n8n workflow aktif mi?
# 3. Vapi provider'lar aktif mi? (OpenAI, 11Labs, Deepgram)
# 4. Logs:
#    - n8n executions
#    - Vapi Dashboard → Calls
```

### Ses gelmiyor
```bash
# 1. 11Labs API key doğru mu?
# 2. Voice ID geçerli mi?
# 3. Alternative: Azure TTS kullan
```

### Function call çalışmıyor
```bash
# Webhook'u manuel test et
curl -X POST https://your-n8n.com/webhook/vapi-customer-service \
  -H "Content-Type: application/json" \
  -d '{"message":{"type":"function-call"...}}'
```

Daha fazla: [VAPI_SETUP_GUIDE.md - Sorun Giderme](N8N_WORKFLOWS/VAPI_SETUP_GUIDE.md#sorun-giderme)

---

## 📚 Dokümantasyon

- **[VAPI_QUICKSTART.md](VAPI_QUICKSTART.md)** - 5 dakikada başla
- **[VAPI_SETUP_GUIDE.md](N8N_WORKFLOWS/VAPI_SETUP_GUIDE.md)** - Detaylı kurulum kılavuzu
- **[.env.vapi.example](.env.vapi.example)** - Environment variables template

---

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📄 Lisans

Bu proje özel kullanım içindir. Lütfen kullanmadan önce iletişime geçin.

---

## 📞 İletişim

- GitHub: [@USYYTGN](https://github.com/USYYTGN)
- Email: info@argus.com

---

## 🙏 Teşekkürler

- [n8n](https://n8n.io) - Workflow automation
- [Vapi](https://vapi.ai) - Voice AI platform
- [Twilio](https://twilio.com) - Communications API
- [Anthropic](https://anthropic.com) - Claude AI
- [11Labs](https://elevenlabs.io) - Voice synthesis

---

**Made with ❤️ by ARGUS Team**

🚀 **Şimdi başla:** [VAPI_QUICKSTART.md](VAPI_QUICKSTART.md)
