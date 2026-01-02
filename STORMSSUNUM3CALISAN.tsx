import { useState, useRef, useEffect } from "react";
import { Plus, Image as ImageIcon, Trash2, Grid, Film, ArrowLeft, Heart, MessageCircle, Send, Bookmark, ShieldCheck, Repeat, UserSquare, Calendar, Clock, Edit3, Video, Play, LogOut, Lock, Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// --- SABİTLER ---
const N8N_WEBHOOK_URL = "https://argusbot.duckdns.org/webhook/save-data";
// n8n GET endpoint üzerinden db.json oku
const DB_FILE_URL = "https://argusbot.duckdns.org/webhook/db.json";
const MASTER_ADMIN_PASS = "stormsadmin";

interface Post { id: string; mediaUrl: string; mediaType: 'image'|'video'; caption: string; date: string; time: string; likes: number; type: 'post'|'reels'|'shared'|'tag'; }
interface Client { id: string; brand_name: string; username: string; password: string; bio: string; logo: string; followers: string; following: string; posts: Post[]; }

const AdminDashboard = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const feedRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- ANA STATES ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authRole, setAuthRole] = useState<'admin' | 'customer' | null>(null);
  const [viewMode, setViewMode] = useState<'admin-list' | 'admin-edit' | 'customer-view'>('admin-list');
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [customerViewMode, setCustomerViewMode] = useState<'profile' | 'feed'>('profile');
  const [activeTab, setActiveTab] = useState<'grid'|'reels'|'shared'|'tags'>('grid');
  const [loginPass, setLoginPass] = useState("");
  const [isLoading, setIsLoading] = useState(true); // YENİ: Veri yükleme durumu

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

  // --- 1. VERİLERİ BULUTTAN ÇEK (CACHE İLE HIZLANDIRILDI!) ---
  useEffect(() => {
    const loadData = async () => {
        console.log("📥 Veri yükleme başlıyor...");
        setIsLoading(true);

        // ÖNCE CACHE'DEN OKU (HIZLI!)
        const cachedData = localStorage.getItem('stormsCacheV1');
        const cacheTime = localStorage.getItem('stormsCacheTime');
        const now = new Date().getTime();

        // Cache varsa ve 5 dakikadan yeniyse kullan
        if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 300000) {
            try {
                const parsed = JSON.parse(cachedData);
                setClients(parsed);
                setIsLoading(false);
                console.log("⚡ Cache'den yüklendi! (Süper hızlı)", parsed.length, "müşteri");
                // Arka planda yenile
                setTimeout(() => loadFromServer(), 1000);
                return;
            } catch (e) {
                console.warn("⚠️ Cache okunamadı, sunucudan çekiliyor...");
            }
        }

        // Cache yoksa veya eskiyse sunucudan çek
        await loadFromServer();
    };

    const loadFromServer = async () => {
        try {
            const res = await fetch(DB_FILE_URL + "?t=" + new Date().getTime(), {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            console.log("📥 GET Response status:", res.status, res.ok);

            if (!res.ok) {
                console.error("❌ DB GET hatası:", res.status, res.statusText);
                setIsLoading(false);
                return;
            }
            const text = await res.text();

            if (!text || text.trim() === '') {
                console.log("⚠️ DB boş, yeni kayıt bekliyor.");
                setIsLoading(false);
                return;
            }
            const data = JSON.parse(text);

            if (Array.isArray(data)) {
                setClients(data);
                // CACHE'E KAYDET (Bir dahaki sefer hızlı!)
                localStorage.setItem('stormsCacheV1', JSON.stringify(data));
                localStorage.setItem('stormsCacheTime', new Date().getTime().toString());
                console.log("✅ Veriler yüklendi ve cache'lendi:", data.length, "müşteri");
            }
        } catch (e: any) {
            console.error("❌ DB yükleme hatası:", e.message);
        } finally {
            setIsLoading(false);
        }
    };

    loadData();
  }, []);

  // --- 2. BULUTA KAYDET (DEBOUNCED + CACHE İLE HIZLANDIRILDI!) ---
  const saveToCloud = async (updatedClients: Client[]) => {
    // ÖNCE UI'I GÜNCELLE (Optimistic Update - Anında görünsün!)
    setClients(updatedClients);

    // CACHE'İ HEMEN GÜNCELLE (Sayfa yenilendiğinde kaybolmasın!)
    localStorage.setItem('stormsCacheV1', JSON.stringify(updatedClients));
    localStorage.setItem('stormsCacheTime', new Date().getTime().toString());
    console.log("⚡ Cache güncellendi (hızlı!)");

    // DEBOUNCING: Önceki kayıt varsa iptal et, 1.5 saniye bekle
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      console.log("⏸️ Önceki kayıt iptal edildi, yeni kayıt bekliyor...");
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const toastId = toast.loading("Buluta kaydediliyor...");
      console.log("💾 Kayıt başlıyor:", updatedClients.length, "müşteri");

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

        if (!response.ok) {
            console.error("❌ HTTP Hatası:", response.status, response.statusText);
            throw new Error(`n8n hatası: ${response.status}`);
        }

        toast.dismiss(toastId);
        toast.success("✅ Kaydedildi!");
        console.log("✅ Başarıyla kaydedildi:", updatedClients.length, "müşteri");

      } catch (err: any) {
        toast.dismiss(toastId);
        console.error("❌ Kayıt hatası:", err);
        toast.error("❌ Kayıt Hatası: " + (err.message || 'Bilinmeyen hata'));
      }
    }, 1500); // 1.5 saniye bekle (hızlı yazarken gereksiz kayıt yapmasın!)
  };

  const activeClient = clients.find(c => c.id === activeClientId);

  // --- 3. GİRİŞ MANTIĞI (DÜZELTİLDİ) ---
  const handleLogin = () => {
    // YENİ: Veriler yüklenirken giriş yapılmasını engelle
    if (isLoading) {
      toast.loading("Veriler yükleniyor, lütfen bekleyin...");
      return;
    }

    console.log("Login denemesi, mevcut müşteri sayısı:", clients.length);

    if (loginPass === MASTER_ADMIN_PASS) {
      setIsLoggedIn(true);
      setAuthRole('admin');
      setViewMode('admin-list');
      toast.success("Hoş geldin Storms Studio!");
      console.log("✅ Admin girişi başarılı");
    } else {
      const client = clients.find(c => c.password === loginPass);
      console.log("Müşteri arama sonucu:", client ? `${client.brand_name} bulundu` : "Bulunamadı");

      if (client) {
        setIsLoggedIn(true);
        setAuthRole('customer');
        setActiveClientId(client.id);
        setViewMode('customer-view');
        toast.success(`Hoş geldin ${client.brand_name}!`);
        console.log("✅ Müşteri girişi başarılı:", client.brand_name);
      } else {
        toast.error("Hatalı Şifre! Lütfen şifrenizi kontrol edin.");
        console.log("❌ Giriş başarısız - şifre eşleşmedi");
      }
    }
  };

  // --- 4. DOSYA SEÇİMİ (RESIZE İLE!) ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Video ise boyut kontrolü yap (max 10MB)
    if (file.type.startsWith('video/')) {
        const maxVideoSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxVideoSize) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            toast.error(`Video çok büyük! (${sizeMB}MB) Max 10MB olmalı.`);
            return;
        }

        toast.loading("Video yükleniyor...");
        const reader = new FileReader();
        reader.onloadend = () => {
            const sizeKB = (file.size / 1024).toFixed(0);
            setNewMedia({ url: reader.result as string, type: 'video' });
            toast.dismiss();
            toast.success(`Video yüklendi! (${sizeKB}KB)`);
            console.log(`🎥 Video: ${sizeKB}KB`);
        };
        reader.readAsDataURL(file);
        return;
    }

    // Görsel ise RESIZE yap (800x800 max, JPEG 0.7 quality)
    try {
        toast.loading("Görsel optimize ediliyor...");

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Max 800x800px (orantılı)
                const maxSize = 800;
                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height *= maxSize / width;
                        width = maxSize;
                    } else {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // JPEG quality 0.7 ile compress
                const resized = canvas.toDataURL('image/jpeg', 0.7);
                const sizeBefore = (img.src.length / 1024).toFixed(0);
                const sizeAfter = (resized.length / 1024).toFixed(0);

                console.log(`🖼️ Resize: ${img.width}x${img.height} → ${width}x${height}, ${sizeBefore}KB → ${sizeAfter}KB`);

                setNewMedia({ url: resized, type: 'image' });
                toast.dismiss();
                toast.success(`Görsel yüklendi! (${sizeAfter}KB)`);
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);

    } catch (err) {
        toast.dismiss();
        toast.error("Görsel yüklenemedi!");
        console.error("Resize hatası:", err);
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

  // --- LOGIN EKRANI RENDER ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-10 shadow-2xl">
            <div className="flex justify-center mb-8"><img src="/logo.png" className="h-24 object-contain" /></div>
            <h2 className="text-xl font-bold text-white text-center mb-8">Storm's Studio Login</h2>
            <div className="space-y-4">
                <div className="relative text-white space-y-2">
                    <Label>Giriş Şifresi</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                        <Input
                            type="password"
                            value={loginPass}
                            onChange={e=>setLoginPass(e.target.value)}
                            onKeyDown={e=>e.key==='Enter' && handleLogin()}
                            className="bg-black border-zinc-800 pl-10 h-12"
                            placeholder="••••••••"
                        />
                    </div>
                </div>
                <Button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700 font-bold h-12 rounded-xl">Sisteme Gir</Button>
            </div>
            <p className="text-[9px] text-zinc-700 text-center mt-6 tracking-wider">by STORM with ARGUS</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 1. ADMIN - MÜŞTERİ LİSTESİ */}
      {authRole === 'admin' && viewMode === 'admin-list' && (
        <div className="p-8 max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-6">
            <h1 className="text-2xl font-black italic">STORM'S STUDIO</h1>
            <Button onClick={()=>setIsAddClientOpen(true)} className="bg-blue-600 rounded-xl h-12"><UserPlus className="mr-2 w-4 h-4"/> Yeni Müşteri Ekle</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {clients.map(c => (
              <div key={c.id} className="bg-zinc-900 p-8 rounded-3xl border border-white/5">
                <h3 className="font-bold text-xl mb-1">{c.brand_name}</h3>
                <p className="text-[11px] text-zinc-500 font-mono mb-6 bg-black/40 p-3 rounded-xl">
                    <span className="text-blue-400">USER:</span> {c.username} <br/>
                    <span className="text-blue-400">PASS:</span> {c.password}
                </p>
                <div className="flex gap-2">
                  <Button onClick={()=>{setActiveClientId(c.id); setViewMode('admin-edit')}} className="flex-1 bg-zinc-800 h-12 rounded-xl">Yönet</Button>
                  <Button onClick={()=>{ if(confirm("Silinsin mi?")) saveToCloud(clients.filter(x=>x.id !== c.id)) }} variant="destructive" size="icon" className="h-12 w-12 rounded-xl"><Trash2/></Button>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={()=>window.location.reload()} variant="ghost" className="mt-16 text-zinc-600"><LogOut className="mr-2 h-4"/> Çıkış Yap</Button>
        </div>
      )}

      {/* 2. ADMIN - MÜŞTERİ YÖNETİMİ */}
      {authRole === 'admin' && viewMode === 'admin-edit' && activeClient && (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                <Button variant="ghost" onClick={()=>setViewMode('admin-list')}><ArrowLeft className="mr-2"/> Geri Dön</Button>
                <Button onClick={()=>setViewMode('customer-view')} className="bg-blue-600 font-bold px-10 h-12 rounded-full shadow-lg shadow-blue-500/20">SİMÜLASYONU GÖR 👁️</Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                <div className="bg-zinc-900 p-6 rounded-3xl h-fit space-y-4">
                    <div onClick={()=>{
                         const i = document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=(e:any)=>{
                             const f=e.target.files[0]; const r=new FileReader();
                             r.onloadend=()=>saveToCloud(clients.map(cl=>cl.id===activeClientId?{...cl,logo:r.result as string}:cl));
                             r.readAsDataURL(f);
                         }; i.click();
                    }} className="w-24 h-24 bg-black rounded-full mx-auto border-2 border-dashed border-zinc-700 flex items-center justify-center cursor-pointer overflow-hidden">
                        {activeClient.logo ? <img src={activeClient.logo} className="w-full h-full object-cover" /> : <ImageIcon className="text-zinc-500" />}
                    </div>
                    <Input value={activeClient.brand_name} onChange={e=>saveToCloud(clients.map(cl=>cl.id===activeClientId?{...cl,brand_name:e.target.value}:cl))} className="bg-black border-none h-12" />
                    <textarea value={activeClient.bio} onChange={e=>saveToCloud(clients.map(cl=>cl.id===activeClientId?{...cl,bio:e.target.value}:cl))} className="w-full bg-black rounded-xl p-2 text-xs h-24" />
                </div>
                <div className="lg:col-span-3">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-bold">İçerik Planı ({activeClient.posts?.length || 0})</h2>
                        <Button onClick={()=>{setEditingPost(null);setNewMedia(null);setNewCaption("");setNewDate("");setNewTime("");setIsPostModalOpen(true)}} className="bg-green-600 font-bold rounded-xl"><Plus className="mr-2 h-4 w-4"/> Yeni İçerik Ekle</Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(activeClient.posts || []).map((post, idx) => (
                            <div key={post.id} className="aspect-square bg-zinc-900 rounded-2xl relative group overflow-hidden border border-white/5">
                                {post.mediaType === 'video' ? <div className="w-full h-full flex items-center justify-center bg-black"><Play className="text-white/30 h-8 w-8" /></div> : <img src={post.mediaUrl} className="w-full h-full object-cover" />}
                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-3 transition-all">
                                    <Button size="sm" variant="outline" className="rounded-full" onClick={()=>{setEditingPost(post);setNewMedia({url:post.mediaUrl,type:post.mediaType});setNewCaption(post.caption);setNewDate(post.date);setNewTime(post.time);setNewType(post.type);setIsPostModalOpen(true)}}><Edit3 className="w-3 h-3 mr-1"/> Düzenle</Button>
                                    <div className="flex gap-2">
                                        {idx>0 && <Button size="icon" variant="ghost" className="h-8 w-8 bg-white/10" onClick={()=> { const p=[...activeClient.posts]; [p[idx],p[idx-1]]=[p[idx-1],p[idx]]; saveToCloud(clients.map(c=>c.id===activeClientId?{...c,posts:p}:c)) }}><Repeat className="h-3 w-3"/></Button>}
                                        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={()=>saveToCloud(clients.map(c=>c.id===activeClientId?{...c,posts:activeClient.posts.filter(x=>x.id!==post.id)}:c))}><Trash2 className="h-3 w-3"/></Button>
                                    </div>
                                </div>
                                <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[9px] font-bold text-white uppercase">{post.date}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* 3. MÜŞTERİ PANELİ (SİMÜLASYON) */}
      {viewMode === 'customer-view' && activeClient && (
          <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
              <div className="w-[390px] h-[844px] bg-black border-[10px] border-zinc-900 rounded-[60px] overflow-hidden relative shadow-2xl flex flex-col">
                  <div className="pt-12 px-6 pb-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-xl z-50 text-white">
                    <div className="flex items-center gap-4">
                        <ArrowLeft className="w-6 h-6 cursor-pointer" onClick={() => customerViewMode==='feed' ? setCustomerViewMode('profile') : (authRole==='admin' ? setViewMode('admin-list') : setIsLoggedIn(false))} />
                        <span className="font-bold text-lg">{activeClient.brand_name}</span>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                  </div>

                  <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {customerViewMode === 'feed' ? (
                        <div className="pb-32 text-white">
                             {(activeClient.posts || []).filter(p=>p.type===activeTab || (activeTab==='grid'&&p.type==='post')).map(post=>(
                                 <div key={post.id} className="mb-6 border-b border-white/5 pb-6">
                                     <div className="flex items-center gap-3 p-4">
                                         <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10"><img src={activeClient.logo} className="w-full h-full object-cover"/></div>
                                         <span className="font-bold text-sm tracking-tight">{activeClient.username}</span>
                                     </div>
                                     <div className="w-full aspect-square bg-zinc-900">
                                         {post.mediaType === 'video' ? <video src={post.mediaUrl} className="w-full h-full object-cover" controls autoPlay loop muted /> : <img src={post.mediaUrl} className="w-full h-full object-cover"/>}
                                     </div>
                                     <div className="p-4 space-y-3">
                                         <div className="flex justify-between items-center"><div className="flex gap-4"><Heart className="h-6 w-6"/><MessageCircle className="h-6 w-6"/><Send className="h-6 w-6"/></div><Bookmark className="h-6 w-6"/></div>
                                         <p className="font-bold text-sm">{post.likes} beğenme</p>
                                         <p className="text-sm leading-snug"><span className="font-bold mr-2">{activeClient.username}</span>{post.caption}</p>
                                         <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">{post.date} • {post.time}</p>
                                         <Button onClick={()=>setIsReviseOpen(true)} className="w-full bg-white text-black font-bold h-10 rounded-xl mt-4">✏️ REVİZE TALEBİ GÖNDER</Button>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    ) : (
                        <div className="pb-32 text-white">
                             <div className="p-6">
                                 <div className="flex justify-between items-center mb-6">
                                     <div className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 shadow-xl">
                                         <div className="w-full h-full rounded-full bg-black border-[3px] border-black overflow-hidden"><img src={activeClient.logo} className="w-full h-full object-cover"/></div>
                                     </div>
                                     <div className="flex gap-6 text-center pr-4">
                                         <div><div className="font-black text-lg">{activeClient.posts?.length || 0}</div><div className="text-[10px] text-zinc-500 font-bold uppercase">Posts</div></div>
                                         <div><div className="font-black text-lg">{activeClient.followers}</div><div className="text-[10px] text-zinc-500 font-bold uppercase">Followers</div></div>
                                         <div><div className="font-black text-lg">{activeClient.following}</div><div className="text-[10px] text-zinc-500 font-bold uppercase">Following</div></div>
                                     </div>
                                 </div>
                                 <h1 className="font-bold text-sm tracking-tight mb-1">{activeClient.brand_name}</h1>
                                 <p className="text-xs text-zinc-300 leading-normal whitespace-pre-line">{activeClient.bio}</p>
                             </div>
                             <div className="flex border-t border-white/5 sticky top-[72px] bg-black/90 backdrop-blur-xl z-40">
                                 {[{id:'grid',icon:<Grid/>},{id:'reels',icon:<Film/>},{id:'shared',icon:<Repeat/>},{id:'tags',icon:<UserSquare/>}].map(t=><button key={t.id} onClick={()=>setActiveTab(t.id as any)} className={`flex-1 py-4 flex justify-center ${activeTab===t.id?'border-b-2 border-white text-white':'text-zinc-500'}`}>{t.icon}</button>)}
                             </div>
                             <div className="grid grid-cols-3 gap-[2px]">
                                 {(activeClient.posts || []).filter(p=>p.type===activeTab || (activeTab==='grid'&&p.type==='post')).map(post=>(
                                     <div key={post.id} className="aspect-square relative cursor-pointer" onClick={()=>{setCustomerViewMode('feed')}}>
                                         {post.mediaType === 'video' ? <div className="w-full h-full flex items-center justify-center bg-zinc-800"><Play className="text-white/20"/></div> : <img src={post.mediaUrl} className="w-full h-full object-cover"/>}
                                     </div>
                                 ))}
                             </div>
                        </div>
                    )}
                  </div>
                  {/* BOTTOM NAV - LOGO */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-black/80 backdrop-blur-2xl border-t border-white/5 flex justify-around items-center px-6 pb-6">
                      <Grid className="h-6 w-6 text-white" />
                      <div className="h-6 w-6 border-2 border-white rounded-lg flex items-center justify-center"><Plus className="h-4 w-4 text-white"/></div>
                      <div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/20 overflow-hidden flex items-center justify-center">
                        <img src="/logo.png" className="h-8 w-8 object-contain opacity-50" />
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODALS (ADD CLIENT) */}
      <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white rounded-3xl">
              <DialogHeader><DialogTitle>Yeni Müşteri Oluştur</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                  <Input placeholder="Marka Adı" value={newClientData.brand} onChange={e=>setNewClientData({...newClientData, brand:e.target.value})} className="bg-black border-none h-12" />
                  <Input placeholder="Kullanıcı Adı" value={newClientData.user} onChange={e=>setNewClientData({...newClientData, user:e.target.value})} className="bg-black border-none h-12" />
                  <Input placeholder="Erişim Şifresi" value={newClientData.pass} onChange={e=>setNewClientData({...newClientData, pass:e.target.value})} className="bg-black border-none h-12" />
                  <Button onClick={()=>{
                      if(!newClientData.brand || !newClientData.pass) return toast.error("Marka adı ve şifre zorunlu!");
                      const newClient: Client = {
                          id: Math.random().toString(36).substr(2,9),
                          brand_name: newClientData.brand,
                          username: newClientData.user || newClientData.brand.toLowerCase().replace(/\s+/g, ''),
                          password: newClientData.pass,
                          bio: "Bio eklenecek...",
                          logo: "",
                          followers: "1K",
                          following: "100",
                          posts: []
                      };
                      const updated = [...clients, newClient];
                      saveToCloud(updated);
                      setIsAddClientOpen(false);
                      setNewClientData({brand:"",user:"",pass:""});
                      toast.success(`${newClient.brand_name} eklendi! Şifre: ${newClient.password}`);
                  }} className="bg-blue-600 w-full h-12 font-bold rounded-xl">Kaydet ve Buluta Yaz</Button>
              </div>
          </DialogContent>
      </Dialog>

      {/* MODALS (ADD CONTENT) */}
      <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white rounded-3xl">
              <DialogHeader><DialogTitle>{editingPost ? "İçeriği Güncelle" : "Yeni İçerik"}</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                  <div onClick={()=>fileInputRef.current?.click()} className="border-2 border-dashed border-zinc-700 p-8 text-center rounded-2xl cursor-pointer hover:bg-zinc-800/50">
                      {newMedia ? <img src={newMedia.url} className="h-32 mx-auto rounded-xl"/> : <p className="text-zinc-500">Görsel veya Video Seç</p>}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <Input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} className="bg-black border-none h-12" />
                      <Input type="time" value={newTime} onChange={e=>setNewTime(e.target.value)} className="bg-black border-none h-12" />
                  </div>
                  <textarea value={newCaption} onChange={e=>setNewCaption(e.target.value)} placeholder="Açıklama..." className="w-full bg-black border-none rounded-xl p-3 text-sm h-24" />
                  <div className="flex gap-2">
                      {['post','reels','shared'].map(t=><Button key={t} variant={newType===t?'default':'ghost'} onClick={()=>setNewType(t as any)} className={`flex-1 text-[10px] uppercase font-bold ${newType===t ? 'bg-zinc-800':'text-zinc-600'}`}>{t}</Button>)}
                  </div>
                  <Button onClick={handleSavePost} className="bg-blue-600 w-full h-12 font-bold rounded-xl">BULUTA PAYLAŞ</Button>
              </div>
          </DialogContent>
      </Dialog>

      {/* MODALS (REVISE) */}
      <Dialog open={isReviseOpen} onOpenChange={setIsReviseOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white rounded-3xl">
              <DialogHeader><DialogTitle>Revize Talebi</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                  <textarea value={reviseNote} onChange={e=>setReviseNote(e.target.value)} placeholder="Notunuz..." className="w-full bg-black border-none rounded-2xl p-4 text-sm h-32 focus:outline-none" />
                  <Button onClick={()=>{
                      toast.success("Mesajınız ulaştı, en kısa sürede döneceğiz");
                      window.location.href=`mailto:info@stormsstudio.com?subject=Revize:${activeClient?.brand_name}&body=${reviseNote}`;
                      setIsReviseOpen(false); setReviseNote("");
                  }} className="bg-blue-600 w-full h-14 font-black rounded-2xl uppercase italic">Gönder</Button>
              </div>
          </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
