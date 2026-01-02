import React, { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Toaster, toast } from 'sonner';
import { UserCircle, Phone, Mail, Calendar, LogOut, Edit2 } from 'lucide-react';

const N8N_LOGIN_URL = "https://argusbot.duckdns.org/webhook/crew-login";
const N8N_UPDATE_URL = "https://argusbot.duckdns.org/webhook/crew-update";

interface User {
  name: string;
  position: string;
  phone: string;
  email: string;
  izinGunu: number;
  ekstraIzin: number;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('crewUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(N8N_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setIsLoggedIn(true);
        localStorage.setItem('crewUser', JSON.stringify(data.user));
        toast.success('Giriş başarılı!');
        setUsername('');
        setPassword('');
      } else {
        toast.error(data.error || 'Giriş başarısız');
      }
    } catch (error) {
      toast.error('Bağlantı hatası');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('crewUser');
    toast.success('Çıkış yapıldı');
  };

  const handleUpdate = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const response = await fetch(N8N_UPDATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          phone: editPhone,
          email: editEmail
        })
      });

      const data = await response.json();

      if (data.success) {
        const updatedUser = { ...user, phone: editPhone, email: editEmail };
        setUser(updatedUser);
        localStorage.setItem('crewUser', JSON.stringify(updatedUser));
        setIsEditModalOpen(false);
        toast.success('Bilgiler güncellendi!');
      } else {
        toast.error('Güncelleme başarısız');
      }
    } catch (error) {
      toast.error('Bağlantı hatası');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    if (user) {
      setEditPhone(user.phone);
      setEditEmail(user.email);
      setIsEditModalOpen(true);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Toaster position="top-center" />
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Crew Portal</h1>
            <p className="text-gray-600 mt-2">Personel Giriş Paneli</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="username" className="text-gray-700">Kullanıcı Adı</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ahmet Yılmaz"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="mt-1"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Toaster position="top-center" />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center">
                <UserCircle className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{user?.name}</h2>
                <p className="text-gray-600">{user?.position}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Çıkış
            </Button>
          </div>
        </div>

        {/* İzin Bilgileri */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-800">İzin Günü</h3>
            </div>
            <p className="text-5xl font-bold text-blue-600">{user?.izinGunu || 0}</p>
            <p className="text-gray-600 mt-2">Toplam izin hakkı</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-800">Ekstra İzin</h3>
            </div>
            <p className="text-5xl font-bold text-green-600">{user?.ekstraIzin || 0}</p>
            <p className="text-gray-600 mt-2">Bonus izin günü</p>
          </div>
        </div>

        {/* İletişim Bilgileri */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">İletişim Bilgileri</h3>
            <Button
              onClick={openEditModal}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Düzenle
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Telefon</p>
                <p className="font-semibold text-gray-800">{user?.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">E-posta</p>
                <p className="font-semibold text-gray-800">{user?.email || 'Belirtilmemiş'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İletişim Bilgilerini Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="editPhone">Telefon</Label>
              <Input
                id="editPhone"
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="05XX XXX XX XX"
              />
            </div>
            <div>
              <Label htmlFor="editEmail">E-posta</Label>
              <Input
                id="editEmail"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <Button
              onClick={handleUpdate}
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
