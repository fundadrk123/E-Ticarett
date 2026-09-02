# LinkedIn Paylaşım Paketi

Bu klasör, projeyi LinkedIn'de portföy olarak paylaşmak için gerekli tüm materyalleri içerir.

## İçerik

| Dosya / Klasör | Açıklama |
|----------------|----------|
| [DEPLOY.md](DEPLOY.md) | Vercel + Neon canlı demo deploy rehberi |
| [POST.md](POST.md) | Kopyala-yapıştır LinkedIn paylaşım metni |
| [screenshots/](screenshots/) | Ham ekran görüntüleri (8 sayfa) |
| [carousel/](carousel/) | LinkedIn carousel slaytları (1080×1080, 9 adet) |

## Hızlı Başlangıç

### 1. LinkedIn'de paylaş (deploy gerekmez)
1. [POST.md](POST.md) metnini kopyalayın
2. LinkedIn → **Start a post** → metni yapıştırın
3. **Add a document** veya görsel → `carousel/` klasöründeki PNG'leri sırayla yükleyin (01 → 09)
4. Salı–Perşembe, 09:00–11:00 arası paylaşın

### 2. Profil entegrasyonu
- **Featured** bölümüne GitHub linki ekleyin: `https://github.com/fundadrk123/E-Ticarett`
- Thumbnail: `carousel/01-cover.png`
- Skills: Next.js, TypeScript, PostgreSQL, REST API

## Carousel Slaytları

| # | Dosya | İçerik |
|---|-------|--------|
| 1 | `01-cover.png` | Kapak — proje adı + tech badge'ler |
| 2 | `02-magaza.png` | Ana sayfa screenshot |
| 3 | `03-katalog.png` | Ürün listesi |
| 4 | `04-urun-detay.png` | Ürün detay |
| 5 | `05-sepet-odeme.png` | Sepet / checkout |
| 6 | `06-admin.png` | Admin giriş |
| 7 | `07-tech-stack.png` | Tech stack özeti |
| 8 | `08-metrikler.png` | Proje metrikleri |
| 9 | `09-cta.png` | Demo + GitHub CTA |

## Yeniden Oluşturma

```bash
# Dev sunucu açıkken ekran görüntüsü al (Playwright gerekir)
node scripts/take-linkedin-screenshots.mjs

# Carousel slaytlarını oluştur
python scripts/build_linkedin_carousel.py
```

## Canlı demo (opsiyonel)

Deploy etmek isterseniz: [DEPLOY.md](DEPLOY.md)

## Kontrol Listesi

- [ ] GitHub repo public
- [ ] Carousel yüklendi (9 slayt)
- [ ] Featured bölümüne eklendi
- [ ] İlk yorum atıldı
