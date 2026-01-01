# 📥 GET ENDPOINT IMPORT TALİMATI

## 🎯 AMAÇ:
`db.json` dosyasını web'den okuyabilmek için n8n'de GET endpoint oluşturmak.

## 📝 ADIMLAR:

### 1. n8n'i Aç
```
https://argusbot.duckdns.org
```

### 2. Import from File
1. Sol üstte **"+"** (Yeni Workflow)
2. **"Import from File"** seç
3. Dosya seç: `STORMSFOTO_GET_ENDPOINT.json`

### 3. Workflow Ayarları
- **Name:** `stormsfoto-get-db`
- **Description:** Reads db.json and returns as JSON

### 4. Node'ları Kontrol Et

Workflow 4 node içermeli:

```
┌─────────────────┐
│  Webhook GET    │ → HTTP GET /webhook/db.json
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Read DB File   │ → /var/www/html/db.json oku
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Parse JSON    │ → JSON parse et
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Respond JSON   │ → CORS headers + JSON dön
└─────────────────┘
```

#### Node 1: Webhook GET
- **HTTP Method:** GET
- **Path:** `db.json`
- **Response Mode:** Using 'Respond to Webhook' Node

#### Node 2: Read DB File
- **Operation:** Read File(s) From Disk
- **File(s) Selector:** `/var/www/html/db.json`

#### Node 3: Parse JSON (Code Node)
```javascript
const fileData = $input.first().binary.data.data;
const jsonString = Buffer.from(fileData, 'base64').toString('utf8');

let jsonData;
try {
  jsonData = JSON.parse(jsonString);
} catch (e) {
  jsonData = [];
}

return [{ json: { data: jsonData } }];
```

#### Node 4: Respond JSON
- **Respond With:** JSON
- **Response Body:** `={{ JSON.stringify($json.data) }}`
- **Headers:**
  - `Access-Control-Allow-Origin: *`
  - `Content-Type: application/json`
  - `Cache-Control: no-cache, no-store, must-revalidate`

### 5. ACTIVE Yap
Sağ üstte **ACTIVE** toggle'ını aç! ✅

### 6. Test Et
Terminal'de:
```bash
curl https://argusbot.duckdns.org/webhook/db.json
```

**Beklenen Cevap:**
```json
[
  {
    "id": "abc123",
    "brand_name": "Test Müşteri",
    "username": "testuser",
    "password": "test123",
    ...
  }
]
```

## ✅ BAŞARI KRİTERLERİ:

1. ✅ Workflow listede görünüyor
2. ✅ Status: **ACTIVE** (yeşil)
3. ✅ `curl` komutu JSON array dönüyor
4. ✅ Browser Console'da "✅ Veriler yüklendi: X müşteri" yazıyor

## ❌ SORUN GİDERME:

### "404 Not Found"
→ Workflow aktif değil, ACTIVE yap

### "Empty response"
→ db.json dosyası boş, önce müşteri ekle

### "Permission denied"
→ db.json dosya izinleri yanlış:
```bash
sudo chmod 666 /var/www/html/db.json
```

### "CORS error"
→ Respond to Webhook node'unda headers yok, kontrol et

## 🎊 TAMAMLANDI!
Artık React uygulaması db.json'dan veri okuyabilecek!
