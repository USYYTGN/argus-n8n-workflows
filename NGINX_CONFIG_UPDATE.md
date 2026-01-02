# 🔧 NGINX LİMİT AYARLAMA TALİMATI

## Sunucuda Yapılacak İşlem

### 1. nginx.conf Dosyasını Aç
```bash
sudo nano /etc/nginx/nginx.conf
```

### 2. http Bloğuna Ekle (zaten 50M var, 100M yap)

**ESKİ:**
```nginx
http {
    client_max_body_size 50M;
    ...
}
```

**YENİ:**
```nginx
http {
    client_max_body_size 100M;
    ...
}
```

### 3. nginx'i Test Et ve Restart Et
```bash
# Test et (syntax hatası var mı?)
sudo nginx -t

# Restart et
sudo systemctl restart nginx
```

### 4. Kontrol Et
```bash
# nginx çalışıyor mu?
sudo systemctl status nginx
```

---

## ✅ TAMAMLANDI!

Artık sistem **100MB**'a kadar POST request kabul eder.

**Ne demek bu?**
- Tek seferde maksimum 100MB veri gönderilebilir
- ~30-40 müşteri + 500 fotoğraf sorunsuz
- Video limiti kod tarafında: **Max 10MB/video**
