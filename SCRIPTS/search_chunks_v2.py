#!/usr/bin/env python3
"""
ARGUS Manual Search v2 — Metadata'lı JSON İndekste Arama
=========================================================
ingest_with_pages.py tarafından üretilen JSON indeksi tarar.
Her sonuçta artık gerçek PDF adı ve sayfa numarası var.

Kullanım:
  python3 search_chunks_v2.py alarm fault detector
  python3 search_chunks_v2.py "yakıt pompası"

Döndürür (JSON):
  {
    "ok": true,
    "query": "alarm fault detector",
    "result_count": 3,
    "results": [
      {
        "pdf_file":    "SALWICO_MANUEL.pdf",
        "manual_name": "SALWICO_MANUEL",
        "page":        43,
        "score":       12,
        "text":        "..."
      }, ...
    ]
  }

Env değişkenleri:
  INDEX_DIR    → indeks klasörü (default: /home/argus/manuals_index)
  MAX_RESULTS  → max sonuç sayısı (default: 5)
"""

import os
import sys
import json
import re

INDEX_DIR   = os.getenv("INDEX_DIR",   "/home/argus/manuals_index")
MAX_RESULTS = int(os.getenv("MAX_RESULTS", "5"))


# ─── Yardımcı ─────────────────────────────────────────────────────────────────
def make_response(ok, query="", query_terms=None, results=None, error=None):
    payload = {
        "ok":           ok,
        "query":        query,
        "query_terms":  query_terms or [],
        "result_count": len(results or []),
        "results":      results or []
    }
    if error:
        payload["error"] = error
    return payload


def clean_text(text: str) -> str:
    text = text.strip()
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text


# ─── Ana mantık ───────────────────────────────────────────────────────────────
raw_args    = sys.argv[1:]
query       = " ".join(raw_args).strip()
query_terms = [t.lower() for t in raw_args]

# Kullanım hatası
if not raw_args:
    print(json.dumps(
        make_response(False, error="Kullanım: python3 search_chunks_v2.py alarm fault detector"),
        ensure_ascii=False, indent=2
    ))
    sys.exit(0)

# İndeks klasörü kontrolü
if not os.path.isdir(INDEX_DIR):
    print(json.dumps(
        make_response(
            False, query=query, query_terms=query_terms,
            error=f"INDEX_DIR bulunamadı: {INDEX_DIR}\n"
                  f"Önce ingest_with_pages.py çalıştırın."
        ),
        ensure_ascii=False, indent=2
    ))
    sys.exit(0)

# ─── Arama ────────────────────────────────────────────────────────────────────
try:
    results = []

    for root, _, files in os.walk(INDEX_DIR):
        for filename in files:
            if not filename.endswith(".json"):
                continue

            path = os.path.join(root, filename)
            try:
                with open(path, "r", encoding="utf-8", errors="replace") as f:
                    index = json.load(f)
            except Exception:
                continue

            manual_name = index.get("manual_name", filename.replace(".json", ""))
            pdf_file    = index.get("pdf_file", manual_name + ".pdf")

            for chunk in index.get("chunks", []):
                text = chunk.get("text", "")
                if not text:
                    continue

                text_lower = text.lower()
                score = sum(text_lower.count(term) for term in query_terms)

                if score > 0:
                    results.append({
                        "chunk_id":    chunk.get("chunk_id", ""),
                        "manual_name": manual_name,
                        "pdf_file":    pdf_file,
                        "page":        chunk.get("page", "?"),
                        "score":       score,
                        "text":        clean_text(text)
                    })

    # Skora göre sırala, en iyi MAX_RESULTS tane al
    results.sort(key=lambda x: x["score"], reverse=True)
    top = results[:MAX_RESULTS]

    print(json.dumps(
        make_response(True, query=query, query_terms=query_terms, results=top),
        ensure_ascii=False, indent=2
    ))

except Exception as e:
    print(json.dumps(
        make_response(False, query=query, query_terms=query_terms, error=str(e)),
        ensure_ascii=False, indent=2
    ))
    sys.exit(1)
