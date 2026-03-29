#!/usr/bin/env python3
"""
ARGUS Manual Ingest - Sayfa Metadata'lı JSON İndeks Üreticisi
=============================================================
PDF'leri sayfa sayfa okur, her chunk'a şu bilgileri kaydeder:
  - manual_name  (PDF dosya adı, uzantısız)
  - pdf_file     (PDF dosya adı, .pdf uzantılı)
  - page         (gerçek sayfa numarası)
  - text         (chunk metni)

Kullanım:
  python3 ingest_with_pages.py                     # tüm /home/argus/manuals/
  python3 ingest_with_pages.py --dir electric      # sadece belirli alt klasör
  python3 ingest_with_pages.py --pdf dosya.pdf     # tek PDF

Çıktı:
  /home/argus/manuals_index/<alt_klasör>/<MANUAL_ADI>.json

Gereksinim:
  pdftotext  (poppler-utils)  →  sudo apt install poppler-utils
"""

import os
import sys
import json
import subprocess
import re
import argparse

# ─── Ayarlar ──────────────────────────────────────────────────────────────────
MANUALS_DIR  = os.getenv("MANUALS_DIR",  "/home/argus/manuals")
INDEX_DIR    = os.getenv("INDEX_DIR",    "/home/argus/manuals_index")
CHUNK_SIZE   = 1500   # karakter — vektör araması için iyi denge
OVERLAP      = 150    # context kaybını önlemek için


# ─── PDF → sayfa listesi ───────────────────────────────────────────────────────
def pdf_to_pages(pdf_path: str) -> list[str]:
    """
    pdftotext -layout ile PDF'i düz metne çevirir.
    Form-feed karakteri (\f) sayfa sınırlarını belirtir.
    Sayfaları trim edilmiş string listesi olarak döndürür.
    """
    try:
        result = subprocess.run(
            ["pdftotext", "-layout", pdf_path, "-"],
            capture_output=True,
            text=True,
            timeout=120,
            encoding="utf-8",
            errors="replace"
        )
        if result.returncode != 0:
            print(f"  [UYARI] pdftotext hata kodu {result.returncode}: {pdf_path}", file=sys.stderr)
            # Yine de çıktıyı kullanmayı dene

        full_text = result.stdout
        if not full_text.strip():
            return []

        # \f (form feed = 0x0C) sayfa ayıracı
        pages = full_text.split("\f")
        return [p.strip() for p in pages if p.strip()]

    except FileNotFoundError:
        print("  [HATA] pdftotext bulunamadı. Kur: sudo apt install poppler-utils", file=sys.stderr)
        return []
    except subprocess.TimeoutExpired:
        print(f"  [HATA] Zaman aşımı: {pdf_path}", file=sys.stderr)
        return []
    except Exception as e:
        print(f"  [HATA] {pdf_path}: {e}", file=sys.stderr)
        return []


# ─── Sayfa → chunk listesi ────────────────────────────────────────────────────
def chunk_page(text: str, page_num: int, manual_name: str) -> list[dict]:
    """
    Bir sayfayı CHUNK_SIZE / OVERLAP ayarlarıyla chunk'lara böler.
    Her chunk'ta manual_name ve page kaydedilir.
    """
    text = re.sub(r"[ \t]+", " ", text)    # fazla boşlukları temizle
    text = re.sub(r"\n{3,}", "\n\n", text) # fazla boş satırları azalt

    chunks = []

    if len(text) <= CHUNK_SIZE:
        chunks.append({
            "chunk_id":    f"{manual_name}_p{page_num:04d}_c00",
            "manual_name": manual_name,
            "pdf_file":    manual_name + ".pdf",
            "page":        page_num,
            "text":        text
        })
    else:
        c = 0
        i = 0
        while i < len(text):
            chunk_text = text[i : i + CHUNK_SIZE].strip()
            if len(chunk_text) > 80:   # çok kısa parçaları atla
                chunks.append({
                    "chunk_id":    f"{manual_name}_p{page_num:04d}_c{c:02d}",
                    "manual_name": manual_name,
                    "pdf_file":    manual_name + ".pdf",
                    "page":        page_num,
                    "text":        chunk_text
                })
                c += 1
            i += (CHUNK_SIZE - OVERLAP)

    return chunks


# ─── PDF işleme ───────────────────────────────────────────────────────────────
def process_pdf(pdf_path: str, output_dir: str) -> int:
    """
    Tek bir PDF'i işler; JSON indeks dosyası oluşturur.
    Döndürür: üretilen chunk sayısı
    """
    manual_name = os.path.splitext(os.path.basename(pdf_path))[0]
    pages = pdf_to_pages(pdf_path)

    if not pages:
        print(f"  [ATLA] Metin çıkarılamadı veya boş: {pdf_path}")
        return 0

    all_chunks = []
    for page_num, page_text in enumerate(pages, start=1):
        if not page_text:
            continue
        all_chunks.extend(chunk_page(page_text, page_num, manual_name))

    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, f"{manual_name}.json")

    index_data = {
        "manual_name":   manual_name,
        "pdf_file":      manual_name + ".pdf",
        "pdf_path":      pdf_path,
        "total_pages":   len(pages),
        "total_chunks":  len(all_chunks),
        "chunks":        all_chunks
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    return len(all_chunks)


# ─── Klasör tarama ────────────────────────────────────────────────────────────
def process_directory(source_dir: str) -> None:
    """Bir klasördeki tüm PDF'leri işler."""
    if not os.path.isdir(source_dir):
        print(f"[HATA] Klasör bulunamadı: {source_dir}")
        sys.exit(1)

    total_pdfs   = 0
    total_chunks = 0
    skipped      = 0

    for root, _, files in os.walk(source_dir):
        for filename in sorted(files):
            if not filename.lower().endswith(".pdf"):
                continue

            pdf_path = os.path.join(root, filename)

            # Çıktı klasörünü manuals/ yapısını koruyarak oluştur
            rel_dir    = os.path.relpath(root, MANUALS_DIR)
            output_dir = os.path.join(INDEX_DIR, rel_dir)

            print(f"  → {filename} ... ", end="", flush=True)
            count = process_pdf(pdf_path, output_dir)

            if count > 0:
                print(f"{count} chunk, {output_dir}")
                total_chunks += count
                total_pdfs   += 1
            else:
                skipped += 1

    print(f"\n{'='*60}")
    print(f"Tamamlandı!")
    print(f"  PDF sayısı  : {total_pdfs}")
    print(f"  Chunk sayısı: {total_chunks}")
    print(f"  Atlanan     : {skipped}")
    print(f"  İndeks      : {INDEX_DIR}")


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="ARGUS Manual Ingest — sayfa metadata'lı JSON indeks üretir"
    )
    parser.add_argument("--dir", help="Sadece bu alt klasörü işle (örn: manta_anadolu/electric)")
    parser.add_argument("--pdf", help="Sadece bu PDF'i işle (tam path)")
    args = parser.parse_args()

    if args.pdf:
        # Tek PDF
        if not os.path.isfile(args.pdf):
            print(f"[HATA] Dosya bulunamadı: {args.pdf}")
            sys.exit(1)
        output_dir = os.path.join(INDEX_DIR, "manual")
        print(f"Tek PDF işleniyor: {args.pdf}")
        count = process_pdf(args.pdf, output_dir)
        print(f"Tamamlandı: {count} chunk → {output_dir}")

    elif args.dir:
        # Alt klasör
        target = os.path.join(MANUALS_DIR, args.dir)
        print(f"Klasör işleniyor: {target}")
        process_directory(target)

    else:
        # Tümü
        print(f"Tüm manuals işleniyor: {MANUALS_DIR}")
        print(f"İndeks çıktısı      : {INDEX_DIR}\n")
        process_directory(MANUALS_DIR)


if __name__ == "__main__":
    main()
