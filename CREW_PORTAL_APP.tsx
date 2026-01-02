import { useState, useEffect } from "react";
import { Ship, User, LogOut, Calendar, Phone, Mail, MapPin, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// --- SABİTLER ---
const N8N_LOGIN_URL = "https://argusbot.duckdns.org/webhook/crew-login";
const N8N_UPDATE_URL = "https://argusbot.duckdns.org/webhook/crew-update";

interface PersonelData {
  "Ad Soyad": string;
  "Genevi yeri": string;
  "Amir Notu": string;
  "Telefon": string;
  "Son Gemiş": string;
  "Ruhsatsızlık": string;
  "Şifre": string;
  // ... diğer 20+ kolon
  izinGunu?: number | null;
  durumMesaji?: string;
}

const CrewPortal = () => {
  // --- ANA STATES ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Personel bilgileri
  const [personelData, setPersonelData] = useState<PersonelData | null>(null);
  const [editedData, setEditedData] = useState<Partial<PersonelData>>({});

  // --- 1. LOGİN FONKSİYONU ---
  const handleLogin = async () => {
    if (!loginUsername || !loginPassword) {
      toast.error("Kullanıcı adı ve şifre gerekli!");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(N8N_LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword
        })
      });

      const data = await response.json();
      console.log("📥 Login response:", data);

      if (data.success) {
        setPersonelData(data.personelData);
        setEditedData(data.personelData);
        setIsLoggedIn(true);
        toast.success(data.message || "Hoşgeldiniz!");
      } else {
        toast.error(data.message || "Giriş başarısız!");
      }
    } catch (err: any) {
      console.error("❌ Login hatası:", err);
      toast.error("Bağlantı hatası!");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. GÜNCELLEME FONKSİYONU ---
  const handleUpdate = async () => {
    if (!personelData) return;

    setIsLoading(true);
    try {
      const response = await fetch(N8N_UPDATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: personelData["Ad Soyad"],
          updatedFields: editedData
        })
      });

      const data = await response.json();
      console.log("📤 Update response:", data);

      if (data.success) {
        toast.success(data.message || "Bilgiler güncellendi!");
        setPersonelData({ ...personelData, ...editedData });
      } else {
        toast.error(data.message || "Güncelleme başarısız!");
      }
    } catch (err: any) {
      console.error("❌ Update hatası:", err);
      toast.error("Güncelleme hatası!");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. ÇIKIŞ FONKSİYONU ---
  const handleLogout = () => {
    setIsLoggedIn(false);
    setPersonelData(null);
    setEditedData({});
    setLoginUsername("");
    setLoginPassword("");
    toast.success("Çıkış yapıldı!");
  };

  // --- 4. ALAN GÜNCELLEME ---
  const updateField = (field: keyof PersonelData, value: string) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  // --- LOGİN EKRANI ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Logo / Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Ship className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">CREW PORTAL</h1>
            <p className="text-sm text-white/70 mt-2">Personel Takip Sistemi</p>
          </div>

          {/* Login Form */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-white/90 text-sm font-medium">Ad Soyad</Label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-white/50" />
                <Input
                  type="text"
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pl-11 h-12 rounded-xl"
                  placeholder="İsim Soyisim"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white/90 text-sm font-medium">Şifre</Label>
              <div className="relative">
                <Ship className="absolute left-3 top-3.5 w-5 h-5 text-white/50" />
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pl-11 h-12 rounded-xl"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-white text-blue-900 hover:bg-white/90 font-bold h-12 rounded-xl shadow-lg"
            >
              {isLoading ? "Giriş yapılıyor..." : "GİRİŞ YAP"}
            </Button>
          </div>

          <p className="text-[10px] text-white/40 text-center mt-8 uppercase tracking-widest">
            Powered by ARGUS AI
          </p>
        </div>
      </div>
    );
  }

  // --- PERSONEL PROFİL EKRANI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Ship className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{personelData?.["Ad Soyad"]}</h2>
              <p className="text-xs text-white/60">Personel Bilgileri</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Çıkış
          </Button>
        </div>
      </div>

      {/* İzin Kartı */}
      {personelData?.izinGunu !== null && (
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">İzin Durumu</p>
                <h3 className="text-white text-3xl font-black">
                  {personelData.izinGunu !== undefined && personelData.izinGunu !== null
                    ? `${personelData.izinGunu} GÜN`
                    : "GEMİDE"}
                </h3>
                <p className="text-white/70 text-sm mt-1">{personelData.durumMesaji}</p>
              </div>
              <Calendar className="w-16 h-16 text-white/30" />
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
          <h3 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Personel Bilgileri
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ad Soyad */}
            <div className="space-y-2">
              <Label className="text-white/80 text-sm">Ad Soyad</Label>
              <Input
                value={editedData?.["Ad Soyad"] || ""}
                onChange={e => updateField("Ad Soyad", e.target.value)}
                className="bg-white/10 border-white/20 text-white h-11 rounded-xl"
                disabled
              />
            </div>

            {/* Telefon */}
            <div className="space-y-2">
              <Label className="text-white/80 text-sm flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefon
              </Label>
              <Input
                value={editedData?.["Telefon"] || ""}
                onChange={e => updateField("Telefon", e.target.value)}
                className="bg-white/10 border-white/20 text-white h-11 rounded-xl"
                placeholder="05XX XXX XX XX"
              />
            </div>

            {/* Genevi yeri */}
            <div className="space-y-2">
              <Label className="text-white/80 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Doğum Yeri
              </Label>
              <Input
                value={editedData?.["Genevi yeri"] || ""}
                onChange={e => updateField("Genevi yeri", e.target.value)}
                className="bg-white/10 border-white/20 text-white h-11 rounded-xl"
              />
            </div>

            {/* Son Gemiş */}
            <div className="space-y-2">
              <Label className="text-white/80 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Son Gemiş Tarihi
              </Label>
              <Input
                type="date"
                value={editedData?.["Son Gemiş"] || ""}
                onChange={e => updateField("Son Gemiş", e.target.value)}
                className="bg-white/10 border-white/20 text-white h-11 rounded-xl"
              />
            </div>

            {/* Ruhsatsızlık */}
            <div className="space-y-2">
              <Label className="text-white/80 text-sm">Ruhsatsızlık</Label>
              <Input
                value={editedData?.["Ruhsatsızlık"] || ""}
                onChange={e => updateField("Ruhsatsızlık", e.target.value)}
                className="bg-white/10 border-white/20 text-white h-11 rounded-xl"
              />
            </div>

            {/* Amir Notu */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-white/80 text-sm">Amir Notu</Label>
              <textarea
                value={editedData?.["Amir Notu"] || ""}
                onChange={e => updateField("Amir Notu", e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white rounded-xl p-3 h-24 resize-none"
                placeholder="Notlar..."
              />
            </div>
          </div>

          {/* Güncelle Butonu */}
          <div className="pt-6">
            <Button
              onClick={handleUpdate}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold h-12 rounded-xl shadow-lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {isLoading ? "Kaydediliyor..." : "BİLGİLERİ GÜNCELLE"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrewPortal;
