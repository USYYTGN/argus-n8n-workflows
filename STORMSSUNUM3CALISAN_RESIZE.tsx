import { useState, useRef, useEffect } from "react";
import { Plus, Image as ImageIcon, Trash2, Grid, Film, ArrowLeft, Heart, MessageCircle, Send, Bookmark, ShieldCheck, Repeat, UserSquare, Calendar, Clock, Edit3, Video, Play, LogOut, Lock, Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// --- SABİTLER ---
const N8N_WEBHOOK_URL = "https://argusbot.duckdns.org/webhook/save-data";
const DB_FILE_URL = "https://argusbot.duckdns.org/webhook/db.json";
const MASTER_ADMIN_PASS = "stormsadmin";

interface Post { id: string; mediaUrl: string; mediaType: 'image'|'video'; caption: string; date: string; time: string; likes: number; type: 'post'|'reels'|'shared'|'tag'; }
interface Client { id: string; brand_name: string; username: string; password: string; bio: string; logo: string; followers: string; following: string; posts: Post[]; }

// --- RESIZE FONKSİYONU (YENİ!) ---
const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Orantılı resize
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // JPEG olarak compress (quality: 0.7)
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        console.log("🖼️ Resize:", `${img.width}x${img.height} → ${width}x${height}`,
                    `Boyut: ${(resizedBase64.length/1024).toFixed(0)}KB`);
        resolve(resizedBase64);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const AdminDashboard = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const feedRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // --- ANA STATES ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authRole, setAuthRole] = useState<'admin' | 'customer' | null>(null);
  const [viewMode, setViewMode] = useState<'admin-list' | 'admin-edit' | 'customer-view'>('admin-list');
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [customerViewMode, setCustomerViewMode] = useState<'profile' | 'feed'>('profile');
  const [activeTab, setActiveTab] = useState<'grid'|'reels'|'shared'|'tags'>('grid');
  const [loginPass, setLoginPass] = useState("");

  // Modal/Revize States
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [newClientData, setNewClientData] = useState({ brand: "", user: "", pass: "" });
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [newMedia, setNewMedia] = useState<{url: string, type: 'image'|'video'} | null>(null);
  const [newCaption, setNewCaption] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newType, setNewType] = useState<Post['type']>('post');
  const [isReviseOpen, setIsReviseOpen] = useState(false);
  const [reviseNote, setReviseNote] = useState("");

  // --- 1. VERİLERİ BULUTTAN ÇEK ---
  useEffect(() => {
    const loadData = async () => {
        console.log("📥 Veri yükleme başlıyor...");
        try {
            const res = await fetch(DB_FILE_URL + "?t=" + new Date().getTime(), {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            console.log("📥 GET Response:", res.status, res.ok);

            if (!res.ok) return;
            const text = await res.text();
            if (!text || text.trim() === '') return;

            const data = JSON.parse(text);
            if (Array.isArray(data)) {
                setClients(data);
                console.log("✅ Veriler yüklendi:", data.length, "müşteri");
            }
        } catch (e: any) {
            console.error("❌ DB yükleme hatası:", e.message);
        }
    };
    loadData();
  }, []);

  // --- 2. BULUTA KAYDET ---
  const saveToCloud = async (updatedClients: Client[]) => {
    setClients(updatedClients);
    const toastId = toast.loading("Kaydediliyor...");

    const jsonString = JSON.stringify(updatedClients);
    console.log("💾 Kayıt:", updatedClients.length, "müşteri,", (jsonString.length/1024).toFixed(0), "KB");

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: jsonString
      });

      const responseText = await response.text();
      console.log("📥 Response:", response.status, responseText);

      if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      toast.dismiss(toastId);
      toast.success("✅ Kaydedildi!");

    } catch (err: any) {
      toast.dismiss(toastId);
      console.error("❌ Kayıt hatası:", err);

      if (err.message?.includes('413')) {
          toast.error("❌ Veri çok büyük! Görselleri küçült.");
      } else if (err.message?.includes('Failed to fetch')) {
          toast.error("❌ Bağlantı hatası!");
      } else {
          toast.error("❌ Kayıt hatası: " + err.message);
      }
    }
  };

  const activeClient = clients.find(c => c.id === activeClientId);

  // --- 3. GİRİŞ MANTIĞI ---
  const handleLogin = () => {
    console.log("🔐 Login, müşteri sayısı:", clients.length);

    if (loginPass === MASTER_ADMIN_PASS) {
      setIsLoggedIn(true);
      setAuthRole('admin');
      setViewMode('admin-list');
      toast.success("Hoş geldin Storms Studio!");
    } else {
      const client = clients.find(c => c.password === loginPass);
      if (client) {
        setIsLoggedIn(true);
        setAuthRole('customer');
        setActiveClientId(client.id);
        setViewMode('customer-view');
        toast.success(`Hoş geldin ${client.brand_name}!`);
      } else {
        toast.error("Hatalı Şifre!");
      }
    }
  };

  // --- 4. DOSYA SEÇİMİ (RESIZE İLE!) ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
        // Video için resize yok, direkt oku
        const reader = new FileReader();
        reader.onloadend = () => {
            setNewMedia({ url: reader.result as string, type: 'video' });
            toast.success("Video yüklendi!");
        };
        reader.readAsDataURL(file);
    } else {
        // Resim için resize yap (800x800 max)
        try {
            toast.loading("Görsel optimize ediliyor...");
            const resized = await resizeImage(file, 800, 800);
            setNewMedia({ url: resized, type: 'image' });
            toast.dismiss();
            toast.success("Görsel yüklendi!");
        } catch (err) {
            toast.error("Görsel yüklenemedi!");
        }
    }
  };

  // --- 5. İÇERİK YÖNETİMİ ---
  const handleSavePost = () => {
    if(!newMedia || !newDate || !newTime) return toast.error("Görsel, Tarih ve Saat Zorunlu!");
    const postData: Post = {
        id: editingPost?.id || Math.random().toString(36).substr(2, 9),
        mediaUrl: newMedia.url,
        mediaType: newMedia.type,
        caption: newCaption,
        date: newDate,
        time: newTime,
        likes: editingPost?.likes || Math.floor(Math.random()*500),
        type: newType
    };
    let newPosts = [...(activeClient?.posts || [])];
    if (editingPost) {
        newPosts = newPosts.map(p => p.id === editingPost.id ? postData : p);
    } else {
        newPosts = [postData, ...newPosts];
    }
    saveToCloud(clients.map(c => c.id === activeClientId ? { ...c, posts: newPosts } : c));
    setIsPostModalOpen(false);
    setEditingPost(null);
    setNewMedia(null);
    setNewCaption("");
    setNewDate("");
    setNewTime("");
  };

  // ... (Geri kalan render kodu aynı kalacak - değiştirme)
