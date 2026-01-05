# ARGUS n8n Workflows

Bu repo, ARGUS için özel olarak hazırlanmış n8n workflow'larını içerir.

## 🚀 Özellikler

### 📁 n8n_İş_Akışları

Bu klasörde güncel ve aktif workflow'lar bulunur:

#### 🎨 Nano Banana Pro Reklam Fabrikası
**AI-Powered Advertisement Factory**

E-ticaret mağazaları için profesyonel yapay zeka destekli statik reklam görselleri oluşturur.

**Özellikler:**
- 🤖 Claude Sonnet 4.5 ile reklam beyin fırtınası
- 🖼️ Gemini 3 Pro Image ile görsel oluşturma
- ☁️ Otomatik Google Drive entegrasyonu
- 💬 Sohbet tabanlı interaktif arayüz
- 🎯 5 farklı reklam açısı önerisi
- 🎨 Özelleştirilebilir stil ve metin içerikleri

**Kurulum:**
1. Workflow'u n8n'e import edin
2. OpenRouter API credential'larınızı ekleyin
3. Google Drive OAuth2 credential'larınızı yapılandırın
4. Workflow içindeki `{{WORKFLOW_ID}}` placeholder'ını kendi workflow ID'niz ile değiştirin
5. Workflow'u aktif edin

**Kullanım:**
```
Siz: "Merhaba! Ürün görselim için reklam oluşturmak istiyorum."
AI: "Harika! Ürün görselinizin URL'sini paylaşır mısınız?"
[Süreç devam eder...]
```

**Maliyet:** ~$0.06-0.10 per reklam görseli

---

#### 📊 Diğer Workflow'lar

- **Blog SEO_GEO.json** - SEO optimizasyonlu blog içerik üretimi
- **UGC Reklam Aynı Karakter İle Video.json** - UGC video reklamları
- **VAPI Giden Arama.json** - VAPI entegrasyonlu sesli arama sistemi
- **Whatsapp Agent.json** - WhatsApp AI asistanı

### 📁 N8N_WORKFLOWS

Legacy workflow'lar ve test dosyaları bu klasörde bulunur.

## 🔧 Genel Kurulum Gereksinimleri

### API Anahtarları
- **OpenRouter**: [openrouter.ai](https://openrouter.ai) - AI modelleri için
- **Anthropic**: Claude API erişimi için
- **Google Cloud**: Drive, Sheets entegrasyonları için

### n8n Credential'ları Yapılandırma

1. **OpenRouter API**
   - n8n → Credentials → Add Credential → OpenRouter Api
   - API anahtarınızı girin

2. **Google OAuth2**
   - Google Cloud Console'da proje oluşturun
   - OAuth 2.0 Client ID oluşturun
   - n8n'de credential'ı yapılandırın

3. **Anthropic API**
   - Anthropic Console'dan API key alın
   - n8n credential'ına ekleyin

## 📝 Workflow Import Etme

1. n8n arayüzüne gidin
2. Workflows → Import from File
3. İstediğiniz `.json` dosyasını seçin
4. Credential'ları yapılandırın
5. Workflow ID referanslarını güncelleyin (gerekiyorsa)
6. Workflow'u aktif edin

## ⚠️ Önemli Notlar

- Workflow'lardaki `{{WORKFLOW_ID}}` ve `{{OPENROUTER_CREDENTIAL_ID}}` gibi placeholder'ları kendi değerlerinizle değiştirmeyi unutmayın
- API anahtarlarınızı asla commit etmeyin
- Workflow'ları test ortamında test ettikten sonra production'a alın

## 🐛 Sorun Giderme

### "Invalid Credential" Hatası
- Credential'ların doğru yapılandırıldığından emin olun
- API anahtarlarınızı kontrol edin

### Workflow Çalışmıyor
- Tüm node'ların bağlantılarını kontrol edin
- Webhook'ların aktif olduğundan emin olun
- Log'ları inceleyin

### "Workflow Not Found" Hatası
- Workflow ID referanslarını güncelleyin
- Sub-workflow'ların import edildiğinden emin olun

## 📊 Performans İpuçları

- Yüksek trafikte webhook timeout'larını artırın
- Batch işlemler için pagination kullanın
- API rate limit'lerini göz önünde bulundurun

## 🤝 Katkıda Bulunma

Yeni workflow'lar eklerken:
1. Açıklayıcı isimler kullanın
2. Credential ID'leri placeholder haline getirin
3. Döküman ekleyin (sticky note veya README)
4. Test edin ve commit edin

## 📄 Lisans

Bu workflow'lar ARGUS için özel olarak hazırlanmıştır.

---

**Son Güncelleme:** 2026-01-05
**Hazırlayan:** ARGUS AI Team
