// HAFIZA_PACK_ALL - AI İLE AKILLI FİLTRELEME

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

// ---------------- AI'a özet gönder ----------------
// Her kategoriden ilk 20 satırı al, kısa özet çıkar
const createSummary = (records, maxRecords = 20) => {
  return records.slice(0, maxRecords).map((r, i) => {
    const summary = {};
    for (const [key, val] of Object.entries(r)) {
      // Sadece önemli alanları al, max 100 char
      const str = String(val || '').slice(0, 100);
      if (str.trim()) summary[key] = str;
    }
    summary._index = i; // orijinal index'i sakla
    return summary;
  });
};

const summaries = {
  meeting: createSummary(grouped.meeting),
  note: createSummary(grouped.note),
  lead: createSummary(grouped.lead)
};

// AI'a sor: Hangi kayıtlar önemli?
const aiPrompt = `Sen akıllı bir veri filtreleme asistanısın.

Kullanıcı sorusu: "${query_text}"

Elindeki kayıtlar:
${JSON.stringify(summaries, null, 2)}

GÖREV:
1. Bu sorguya EN UYGUN kayıtları SEÇ (gereksizleri eleme!)
2. Seçilen kayıtların index numaralarını döndür
3. MAX 5 kayıt seç (daha fazla seçme!)

ÇIKTI FORMATI (SADECE JSON):
{
  "meeting": [0, 2],  // meeting kayıtlarından 0 ve 2 numaralıları seç
  "note": [1],        // note kayıtlarından sadece 1 numaralıyı seç
  "lead": [0, 3, 5]   // lead kayıtlarından 0, 3, 5 numaralıları seç
}

ÖNEMLİ:
- İlgisiz kayıtları SEÇME!
- Boş array dönebilirsin: []
- MAX 5 kayıt toplam!
- JSON dışında tek karakter yazma!`;

// Claude API'ye istek at
let selectedIndexes = { meeting: [], note: [], lead: [] };

try {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': $env.ANTHROPIC_API_KEY || 'sk-ant-...', // env'den al
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      temperature: 0,
      messages: [{
        role: 'user',
        content: aiPrompt
      }]
    })
  });

  const result = await response.json();
  const aiText = result.content?.[0]?.text || '{}';

  // JSON parse et
  const cleaned = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  selectedIndexes = JSON.parse(cleaned);
} catch (error) {
  // AI hatası - varsayılan: ilk 2 satır
  selectedIndexes = {
    meeting: grouped.meeting.length > 0 ? [0, 1].filter(i => i < grouped.meeting.length) : [],
    note: grouped.note.length > 0 ? [0, 1].filter(i => i < grouped.note.length) : [],
    lead: grouped.lead.length > 0 ? [0, 1].filter(i => i < grouped.lead.length) : []
  };
}

// ---------------- Seçilen kayıtları döndür ----------------
const hits = {
  meeting: (selectedIndexes.meeting || []).slice(0, 5).map(i => grouped.meeting[i]).filter(Boolean),
  note: (selectedIndexes.note || []).slice(0, 5).map(i => grouped.note[i]).filter(Boolean),
  lead: (selectedIndexes.lead || []).slice(0, 5).map(i => grouped.lead[i]).filter(Boolean)
};

const has_hits = (hits.meeting.length + hits.note.length + hits.lead.length) > 0;

return [{
  json: {
    mode: 'memory_recall',
    query_text,
    entity_guess: '',
    hits,
    has_hits,
    _ai_debug: selectedIndexes // debug için
  }
}];
