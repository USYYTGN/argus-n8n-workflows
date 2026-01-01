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
const LOCALSTORAGE_KEY = "storms_studio_clients";

interface Post { id: string; mediaUrl: string; mediaType: 'image'|'video'; caption: string; date: string; time: string; likes: number; type: 'post'|'reels'|'shared'|'tag'; }
interface Client { id: string; brand_name: string; username: string; password: string; bio: string; logo: string; followers: string; following: string; posts: Post[]; }

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

  // --- 1. VERİLERİ YÜK (localStorage + Cloud Hybrid) ---
  useEffect(() => {
    const loadData = async () => {
        console.log("📥 Veri yükleme başlıyor...");

        // Önce localStorage'dan yükle (hızlı)
        try {
            const localData = localStorage.getItem(LOCALSTORAGE_KEY);
            if (localData) {
                const parsed = JSON.parse(localData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setClients(parsed);
                    console.log("✅ localStorage'dan yüklendi:", parsed.length, "müşteri");
                }
            }
        } catch (e) {
            console.warn("⚠️ localStorage okuma hatası:", e);
        }

        // Sonra cloud'dan senkronize et (opsiyonel)
        try {
            console.log("☁️ Cloud senkronizasyonu deneniyor...");
            const res = await fetch(DB_FILE_URL + "?t=" + new Date().getTime(), {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (res.ok) {
                const text = await res.text();
                if (text && text.trim()) {
                    const data = JSON.parse(text);
                    if (Array.isArray(data) && data.length > 0) {
                        setClients(data);
                        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(data));
                        console.log("✅ Cloud'dan senkronize edildi:", data.length, "müşteri");
                    }
                }
            } else {
                console.log("⚠️ Cloud erişilemedi, localStorage kullanılıyor");
            }
        } catch (e) {
            console.log("⚠️ Cloud senkronizasyon hatası, localStorage kullanılıyor:", e);
        }
    };
    loadData();
  }, []);

  // --- 2. BULUTA KAYDET + localStorage ---
  const saveToCloud = async (updatedClients: Client[]) => {
    setClients(updatedClients);

    // 1. Önce localStorage'a kaydet (anında)
    try {
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(updatedClients));
        console.log("💾 localStorage'a kaydedildi:", updatedClients.length, "müşteri");
    } catch (e) {
        console.error("❌ localStorage kayıt hatası:", e);
    }

    // 2. Sonra cloud'a gönder (opsiyonel)
    const toastId = toast.loading("Kaydediliyor...");
    console.log("☁️ Cloud'a gönderiliyor...");

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(updatedClients)
      });

      const responseText = await response.text();
      console.log("📥 Cloud response:", responseText);

      if (response.ok) {
          toast.dismiss(toastId);
          toast.success("✅ Kaydedildi!");
          console.log("✅ Cloud senkronize edildi");
      } else {
          toast.dismiss(toastId);
          toast.success("✅ Kaydedildi (Yerel)");
          console.warn("⚠️ Cloud'a gönderilemedi ama localStorage'da:", response.status);
      }

    } catch (err: any) {
      toast.dismiss(toastId);
      toast.success("✅ Kaydedildi (Yerel)");
      console.warn("⚠️ Cloud hatası ama localStorage'da güvende:", err.message);
    }
  };

  const activeClient = clients.find(c => c.id === activeClientId);

  // --- 3. GİRİŞ MANTIĞI ---
  const handleLogin = () => {
    console.log("🔐 Login denemesi, müşteri sayısı:", clients.length);

    if (loginPass === MASTER_ADMIN_PASS) {
      setIsLoggedIn(true);
      setAuthRole('admin');
      setViewMode('admin-list');
      toast.success("Hoş geldin Storms Studio!");
      console.log("✅ Admin girişi başarılı");
    } else {
      const client = clients.find(c => c.password === loginPass);
      console.log("🔍 Müşteri arama:", client ? `${client.brand_name} bulundu` : "Bulunamadı");

      if (client) {
        setIsLoggedIn(true);
        setAuthRole('customer');
        setActiveClientId(client.id);
        setViewMode('customer-view');
        toast.success(`Hoş geldin ${client.brand_name}!`);
        console.log("✅ Müşteri girişi:", client.brand_name);
      } else {
        toast.error("Hatalı Şifre!");
        console.log("❌ Şifre eşleşmedi");
      }
    }
  };

  // --- 4. DOSYA SEÇİMİ ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
        const result = reader.result as string;
        const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
        setNewMedia({ url: result, type: mediaType });
        toast.success(`${mediaType === 'video' ? 'Video' : 'Görsel'} yüklendi!`);
    };
    reader.readAsDataURL(file);
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

  // ... (Buradan sonrası aynı - render kısmı değişmiyor)
