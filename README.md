# ARGUS n8n Workflows

Bu repo, ARGUS için özel olarak hazırlanmış n8n workflow'larını içerir.

## 🚀 Özellikler

### 📁 n8n_İş_Akışları

Bu klasörde güncel ve aktif workflow'lar bulunur:

#### 🎨 Nano Banana Pro Reklam Fabrikası
**AI-Powered Advertisement Factory** - 100% Google Gemini Powered ⚡

E-ticaret mağazaları için profesyonel yapay zeka destekli statik reklam görselleri oluşturur.

**Özellikler:**
- 🤖 Gemini 1.5 Pro ile reklam beyin fırtınası
- 🖼️ Gemini Imagen 3.0 ile görsel oluşturma (Nano Banana desteği)
- ☁️ Otomatik Google Drive entegrasyonu
- 💬 Sohbet tabanlı interaktif arayüz
- 🎯 5 farklı reklam açısı önerisi
- 🎨 Özelleştirilebilir stil ve metin içerikleri
- 💰 **UNLIMITED Gemini Pro ile maliyet SIFIR!**

**Kurulum:**
1. Workflow'u n8n'e import edin
2. Google Gemini API credential'larınızı ekleyin (OAuth2 veya API Key)
3. Google Drive OAuth2 credential'larınızı yapılandırın
4. Workflow içindeki `{{WORKFLOW_ID}}` placeholder'ını kendi workflow ID'niz ile değiştirin
5. `{{GOOGLE_GEMINI_CREDENTIAL_ID}}` placeholder'ını güncelleyin
6. Workflow'u aktif edin

**Kullanım:**
```
Siz: "Merhaba! Ürün görselim için reklam oluşturmak istiyorum."
AI: "Harika! Ürün görselinizin URL'sini paylaşır mısınız?"
[Süreç devam eder...]
```

**Maliyet:** ✅ ÜCRETSIZ (Unlimited Gemini Pro subscription ile)

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
- **Google Gemini**: [aistudio.google.com](https://aistudio.google.com) - UNLIMITED Pro subscription önerilir ⚡
- **Google Cloud**: Drive, Sheets, Gemini API entegrasyonları için
- **Anthropic** (opsiyonel): Bazı legacy workflow'lar için

### n8n Credential'ları Yapılandırma

1. **Google Gemini API**
   - [Google AI Studio](https://aistudio.google.com) veya Google Cloud Console kullanın
   - API Key veya OAuth2 credential oluşturun
   - n8n → Credentials → Add Credential → Google PaLM / Google Gemini
   - Credential'ınızı yapılandırın

2. **Google OAuth2 (Drive & Sheets)**
   - Google Cloud Console'da proje oluşturun
   - Drive API ve Sheets API'yi aktif edin
   - OAuth 2.0 Client ID oluşturun
   - n8n'de credential'ı yapılandırın

3. **Anthropic API** (opsiyonel)
   - Legacy workflow'lar için gerekebilir
   - Anthropic Console'dan API key alın

## 📝 Workflow Import Etme

1. n8n arayüzüne gidin
2. Workflows → Import from File
3. İstediğiniz `.json` dosyasını seçin
4. Credential'ları yapılandırın
5. Workflow ID referanslarını güncelleyin (gerekiyorsa)
6. Workflow'u aktif edin

## ⚠️ Önemli Notlar

- Workflow'lardaki placeholder'ları kendi değerlerinizle değiştirin:
  - `{{WORKFLOW_ID}}` - n8n workflow ID'niz
  - `{{GOOGLE_GEMINI_CREDENTIAL_ID}}` - Google Gemini credential ID'niz
- API anahtarlarınızı asla commit etmeyin
- **UNLIMITED Gemini Pro subscription önerilir** - Maliyet sıfır, performans maksimum! ⚡
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
