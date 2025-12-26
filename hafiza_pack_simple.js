// HAFIZA_PACK_ALL - TÜM KAYITLARI TOPLA (AI yok, sadece veri toplama)

// ---------------- helpers ----------------
const normSource = (src) => {
  const s = String(src || '').toLowerCase();
  if (['meeting','toplanti','toplantı'].includes(s)) return 'meeting';
  if (['note','not'].includes(s)) return 'note';
  if (['lead','musteri','müşteri'].includes(s)) return 'lead';
  return '';
};

const pickFirstNonEmpty = (key) => {
  const it = items.find(i => i?.json?.[key] != null && String(i.json[key]).trim() !== '');
  return it ? String(i.json[key]).trim() : '';
};

// ---------------- Veriyi topla ----------------
const query_text = pickFirstNonEmpty('query_text') || pickFirstNonEmpty('userText') || '';
const grouped = { meeting: [], note: [], lead: [] };

for (const it of items) {
  const j = it?.json ?? {};
  const src = normSource(j.source || '');
  if (!src || !grouped[src]) continue;

  // Temiz satır
  const row = { ...j };
  delete row.query_text;
  delete row.entity_guess;
  delete row.systemPrompt;
  delete row.user_id;
  delete row.source;

  grouped[src].push(row);
}

// Eğer hiç veri yoksa direkt dön
const totalRecords = grouped.meeting.length + grouped.note.length + grouped.lead.length;
if (totalRecords === 0) {
  return [{
    json: {
      mode: 'memory_recall',
      query_text,
      hits: { meeting: [], note: [], lead: [] },
      has_hits: false
    }
  }];
}

// ---------------- TÜM KAYITLARI DÖNDÜR ----------------
// AI filtresi yok! Brain endpoint analiz yapacak!
const hits = {
  meeting: grouped.meeting,
  note: grouped.note,
  lead: grouped.lead
};

const has_hits = (hits.meeting.length + hits.note.length + hits.lead.length) > 0;

return [{
  json: {
    mode: 'memory_recall',
    query_text,
    entity_guess: '',
    hits,
    has_hits
  }
}];
