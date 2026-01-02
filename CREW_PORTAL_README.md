# 🚀 CREW PORTAL - KURULUM REHBERİ

## 📋 ADIM ADIM KURULUM

### 1️⃣ Google Sheets'e Şifre Kolonu Ekle (5 dk)
1. Sheets'i aç: https://docs.google.com/spreadsheets/d/1zwJMW_265pUuivAiqJ46OFpwbWjifKeaK-OXZgH8lRw/edit
2. Boş bir kolona **"Şifre"** başlığı ekle (örnek: H kolonu)
3. Her personel için şifre belirle:
   - Ahmet Yılmaz → `ahmet123`
   - Mehmet Demir → `mehmet123`
4. Kaydet!

---

### 2️⃣ n8n Workflow'larını İmport Et (10 dk)

#### GitHub'dan İndir:
- `N8N_WORKFLOWS/CREW_LOGIN.json`
- `N8N_WORKFLOWS/CREW_UPDATE.json`

#### n8n'de:
1. n8n'i aç: https://argusbot.duckdns.org
2. Sol menü → **Workflows**
3. Sağ üst → **"..."** → **Import from File**
4. `CREW_LOGIN.json` seç → Import
5. **Google Sheets credential'ı seç**
6. **Active toggle'ı aç** → Save
7. Tekrarla: `CREW_UPDATE.json` için

#### Webhook URL'lerini Not Et:
- **Login:** `https://argusbot.duckdns.org/webhook/crew-login`
- **Update:** `https://argusbot.duckdns.org/webhook/crew-update`

---

### 3️⃣ React Projesi Oluştur (20 dk)

```bash
# Yeni React projesi
npx create-react-app crew-portal
cd crew-portal

# shadcn/ui kur
npx shadcn-ui@latest init

# Components kur
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add dialog

# Toast ve icons kur
npm install sonner lucide-react
```

---

### 4️⃣ Crew Portal Kodunu Ekle (5 dk)

```bash
# Dosyaları kopyala
cp CREW_PORTAL_APP.tsx crew-portal/src/App.tsx
cp CREW_PORTAL_MANIFEST.json crew-portal/public/manifest.json
```

#### `public/index.html`'e ekle:
```html
<head>
  ...
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#1e40af">
</head>
```

---

### 5️⃣ URL'leri Güncelle (2 dk)

`src/App.tsx` dosyasında:
```typescript
const N8N_LOGIN_URL = "https://argusbot.duckdns.org/webhook/crew-login";
const N8N_UPDATE_URL = "https://argusbot.duckdns.org/webhook/crew-update";
```

---

### 6️⃣ Build Al ve Deploy Et (10 dk)

```bash
# Build al
cd crew-portal
npm run build

# Sunucuda klasör oluştur
ssh user@sunucu
sudo mkdir -p /var/www/html/crew-portal
sudo chown -R $USER:$USER /var/www/html/crew-portal
```

**FileZilla ile:** `dist/` klasörünü → `/var/www/html/crew-portal/` yükle

---

### 7️⃣ nginx Config (5 dk)

```bash
# Sunucuda
sudo nano /etc/nginx/sites-available/crew-portal
```

#### İçine yaz:
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

#### Aktif et:
```bash
sudo ln -s /etc/nginx/sites-available/crew-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 8️⃣ Test Et! ✅

1. Aç: `http://crew.argusa1.duckdns.org`
2. Login yap:
   - **Kullanıcı adı:** Ahmet Yılmaz
   - **Şifre:** ahmet123
3. İzin günü görünüyor mu? ✅
4. Telefon değiştir → Kaydet
5. Sheets'e bak → Güncellenmiş mi?

---

## 🎯 ÖZELLİKLER

- ✅ **Login Sistemi** (İsim + Şifre)
- ✅ **İzin Günü Görüntüleme**
- ✅ **Ekstra İzin Takibi**
- ✅ **Telefon/Email Güncelleme**
- ✅ **Mobil Uyumlu PWA**
- ✅ **Google Sheets Entegrasyonu**

---

## 🔧 SORUN GİDERME

### Login çalışmıyor?
- n8n workflow'ları **Active** mi?
- Google Sheets'te **Şifre** kolonu var mı?
- Webhook URL'leri doğru mu?

### Güncelleme çalışmıyor?
- CREW_UPDATE workflow'u **Active** mi?
- Google Sheets credential'ı bağlı mı?

### nginx 404 hatası?
- `dist/` klasörü doğru yüklenmiş mi?
- nginx config syntax doğru mu? (`sudo nginx -t`)

---

## 📞 DESTEK

Sorun yaşıyorsan:
1. Browser Console'u aç (F12)
2. Network tab'ını kontrol et
3. n8n Executions'ı kontrol et
4. Hata mesajını paylaş!

---

**Made with ❤️ by ARGUS AI**
