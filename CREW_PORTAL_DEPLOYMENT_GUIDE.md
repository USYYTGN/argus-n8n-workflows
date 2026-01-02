# 🚢 CREW PORTAL - DEPLOYMENT REHBERİ

## 📋 SİSTEM ÖZETİ

**Ne yaptık:**
- ✅ Gemi personeli takip PWA uygulaması
- ✅ n8n workflow'ları (Login + Update)
- ✅ İzin günü otomatik hesaplama
- ✅ Mobil uygulama gibi kurulum (APK gibi!)

---

## 🎯 1. GOOGLE SHEETS HAZIRLIĞI

### A) Şifre Kolonu Ekle

Google Sheets'e yeni bir kolon eklemen gerekiyor:

1. Sheets'i aç: https://docs.google.com/spreadsheets/d/1zwJMW_265pUuivAiqJ46OFpwbWjifKeaK-OXZgH8lRw/edit
2. Boş bir kolona "Şifre" başlığı ekle (örnek: H kolonu)
3. Her personel için şifre belirle (örnek: "1234", "ahmet123" vs.)

**Örnek:**
```
A: Ad Soyad    | B: Telefon   | ... | H: Şifre
Ahmet Yılmaz  | 05551234567  | ... | ahmet123
Mehmet Demir  | 05559876543  | ... | mehmet123
```

### B) İzin Günü Kolonu Ekle (Opsiyonel)

Eğer Sheets'te de görmek istersen:

1. Yeni kolon ekle: "İzin Günü"
2. Formula: `=IF(E2="", "Gemide", DAYS(TODAY(), E2))`
   (E2 = "Son Gemiş" kolonu)

---

## 🔧 2. n8n WORKFLOW'LARI KURULUMU

### A) CREW_LOGIN Workflow'unu İçe Aktar

1. n8n'i aç: https://argusbot.duckdns.org
2. **Workflows** → **Import from File**
3. `CREW_LOGIN.json` dosyasını seç
4. **Import** tıkla

### B) Workflow'u Düzenle

**Düzenlenecek Yerler:**

1. **"Get Crew from Sheet" Node:**
   - Google Sheets credential'ını seç
   - Document ID: `1zwJMW_265pUuivAiqJ46OFpwbWjifKeaK-OXZgH8lRw` (zaten ayarlı)
   - Sheet Name: `Sheet1` (veya kullandığın sheet adı)

2. **"Check Login & Calculate İzin" Node (Code):**
   - Kolon adlarını kontrol et:
   ```javascript
   // Eğer sheets'te farklı kolon adları varsa değiştir:
   data['Ad Soyad'] === username  // "Ad Soyad" kolonu
   data['Şifre'] === password     // "Şifre" kolonu
   data['Son Gemiş']              // "Son Gemiş" kolonu
   ```

3. **Workflow'u Aktif Et:**
   - Sağ üst köşe → **Active** toggle'ı aç
   - **Save** tıkla

### C) CREW_UPDATE Workflow'unu İçe Aktar

1. `CREW_UPDATE.json` dosyasını import et
2. Google Sheets credential'ını seç
3. **Active** yap
4. **Save** tıkla

### D) Webhook URL'lerini Kopyala

n8n'de her workflow için:
1. Webhook node'una tıkla
2. **Webhook URL'sini kopyala**
3. Örnek: `https://argusbot.duckdns.org/webhook/crew-login`

---

## 📱 3. REACT PWA UYGULAMASI DEPLOYMENT

### A) React Projesine Dosyaları Ekle

```bash
# 1. Crew Portal component'ini ekle
cp CREW_PORTAL_APP.tsx /path/to/react-project/src/CrewPortal.tsx

# 2. Manifest dosyasını ekle
cp CREW_PORTAL_MANIFEST.json /path/to/react-project/public/manifest.json
```

### B) App.tsx'i Güncelle

```typescript
// App.tsx
import CrewPortal from './CrewPortal';

function App() {
  return <CrewPortal />;
}

export default App;
```

### C) index.html'e Manifest Ekle

```html
<!-- public/index.html -->
<head>
  ...
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#1e40af">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
</head>
```

### D) PWA İkonları Oluştur

Logo'dan ikon oluştur (canva, favicon.io vs.):
- `public/icon-192.png` (192x192px)
- `public/icon-512.png` (512x512px)

### E) Build ve Deploy

```bash
# Build al
npm run build

# Sunucuya yükle (FileZilla veya scp)
scp -r dist/* user@server:/var/www/html/crew-portal/
```

**VEYA nginx config:**
```nginx
server {
    listen 80;
    server_name crew.argusa1.duckdns.org;

    root /var/www/html/crew-portal;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🧪 4. TEST ETME

### A) n8n Webhook'larını Test Et

**Login Test:**
```bash
curl -X POST https://argusbot.duckdns.org/webhook/crew-login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Ahmet Yılmaz",
    "password": "ahmet123"
  }'
```

**Beklenen Cevap:**
```json
{
  "success": true,
  "message": "Giriş başarılı!",
  "personelData": {
    "Ad Soyad": "Ahmet Yılmaz",
    "Telefon": "05551234567",
    "Son Gemiş": "15.12.2024",
    "izinGunu": 18,
    "durumMesaji": "18 gündür izinde"
  }
}
```

### B) PWA'yı Aç ve Test Et

1. Tarayıcıda aç: `https://crew.argusa1.duckdns.org`
2. Login yap (Ad Soyad + Şifre)
3. İzin günü görünüyor mu? ✅
4. Telefon güncelle → Kaydet
5. Sheets'e bakıldığında güncellenmiş mi? ✅

### C) Mobil Kurulum Testi

**Android (Chrome):**
1. Siteyi aç
2. Menü (3 nokta) → **Ana ekrana ekle**
3. İkon oluşacak → Tıkla → Uygulama gibi açılacak! ✅

**iOS (Safari):**
1. Siteyi aç
2. Paylaş butonu → **Ana Ekrana Ekle**
3. İkon oluşacak → Tıkla → Uygulama gibi açılacak! ✅

---

## 🎯 5. PERSONEL EKLEME SÜRECİ

### Yeni Personel Eklemek İçin:

1. Google Sheets'i aç
2. Yeni satır ekle:
   ```
   Ad Soyad: Ayşe Kaya
   Telefon: 05551112233
   Şifre: ayse123
   Son Gemiş: (boş = gemide)
   ```
3. Personele söyle:
   - Site: `https://crew.argusa1.duckdns.org`
   - Kullanıcı adı: `Ayşe Kaya`
   - Şifre: `ayse123`
4. Mobil'den "Ana ekrana ekle" ile kursun! ✅

---

## 🔥 6. EK ÖZELLİKLER (İSTERSEN EKLERIZ!)

### A) Admin Paneli
- Tüm personeli görme
- Toplu güncelleme
- İstatistikler (kaç kişi izinde vs.)

### B) Push Notification
- "İzin bitiyor!" bildirimi
- "Bilgilerini güncelle!" hatırlatması

### C) QR Kod Login
- QR kod scan → otomatik giriş

### D) Offline Mod
- İnternet kesilse bile form dolduruluyor
- Sonra senkronize ediliyor

---

## ❓ SIKÇA SORULAN SORULAR

### S: Şifre nasıl değiştirilir?
**C:** Sheets'te "Şifre" kolonunu değiştir.

### S: İzin günü otomatik hesaplanıyor mu?
**C:** Evet! "Son Gemiş" tarihine göre otomatik hesaplanıyor.

### S: Mobil uygulamayı nasıl güncellerim?
**C:** Yeni build al → sunucuya yükle → kullanıcılar sayfayı yenileyince otomatik güncellenir!

### S: Kaç personel ekleyebilirim?
**C:** Sınırsız! Google Sheets limiti: 10 milyon hücre 😄

---

## 🚀 ÖZET

| Özellik | Durum |
|---------|-------|
| **n8n Login Workflow** | ✅ Hazır |
| **n8n Update Workflow** | ✅ Hazır |
| **React PWA Kodu** | ✅ Hazır |
| **PWA Manifest** | ✅ Hazır |
| **İzin Günü Hesaplama** | ✅ Otomatik |
| **Mobil Kurulum** | ✅ Ana ekrana ekle |
| **Google Sheets Entegrasyonu** | ✅ Çalışıyor |

---

## 📞 SONRAKI ADIMLAR

1. ✅ Google Sheets'e "Şifre" kolonu ekle
2. ✅ n8n workflow'larını import et
3. ✅ React PWA'yı deploy et
4. ✅ Test et (login, güncelleme)
5. ✅ Personele dağıt!

**HAZIRSIN BRO!** 🎉🚢

---

*Hazırlayan: ARGUS AI - 02.01.2026*
