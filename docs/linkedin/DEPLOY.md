# Canlı Demo Deploy Rehberi (Vercel + Neon)

Bu rehber, projeyi LinkedIn paylaşımı için ücretsiz canlı demo olarak yayınlamanız içindir.

## Genel Bakış

| Servis | Rol | Ücretsiz tier |
|--------|-----|---------------|
| [Neon](https://neon.tech) | PostgreSQL 16 | 0.5 GB, proje başına |
| [Vercel](https://vercel.com) | Next.js hosting | Hobby plan |

Deploy sonrası elde edeceğiniz URL örneği: `https://e-ticaret-xxx.vercel.app`

---

## Adım 1 — Neon PostgreSQL

1. [neon.tech](https://neon.tech) → GitHub ile kayıt olun
2. **New Project** → proje adı: `mertem-eticaret`
3. Region: **Frankfurt (eu-central-1)** — Türkiye'ye en yakın
4. Dashboard → **Connection Details** → **Pooled connection** seçin
5. Connection string örneği:

```
postgresql://mertem_owner:xxxxx@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

6. Bu string'i aşağıdaki env değişkenlerine dönüştürün:

| Neon parçası | Env değişkeni | Örnek |
|--------------|---------------|-------|
| Kullanıcı adı | `POSTGRES_USER` | `mertem_owner` |
| Şifre | `POSTGRES_PASSWORD` | `xxxxx` |
| Host (port hariç) | `POSTGRES_HOST` | `ep-cool-name-123456.eu-central-1.aws.neon.tech` |
| Veritabanı adı | `POSTGRES_DB` | `neondb` |
| Port | `POSTGRES_PORT` | `5432` |

> Neon SSL zorunludur; `pg` pool otomatik SSL kullanır. Ek ayar gerekmez.

---

## Adım 2 — Vercel Deploy

1. [vercel.com](https://vercel.com) → GitHub ile giriş
2. **Add New Project** → `fundadrk123/E-Ticarett` reposunu seçin
3. **Branch:** `funda`
4. Framework: Next.js (otomatik algılanır)
5. **Environment Variables** ekleyin (Production + Preview + Development):

### Zorunlu değişkenler

```env
POSTGRES_USER=mertem_owner
POSTGRES_PASSWORD=xxxxx
POSTGRES_HOST=ep-cool-name-123456.eu-central-1.aws.neon.tech
POSTGRES_DB=neondb
POSTGRES_PORT=5432

JWT_SECRET=guclu-rastgele-64-karakter-string-buraya

ADMIN_EMAIL=admin@mertemgrup.com
ADMIN_PASSWORD=GucluAdminSifresi123!

NEXT_PUBLIC_SITE_URL=https://SIZIN-VERCEL-URL.vercel.app
```

> `NEXT_PUBLIC_SITE_URL` değerini ilk deploy'dan sonra gerçek Vercel URL'niz ile güncelleyin ve **Redeploy** yapın.

### Opsiyonel (demo için gerekmez)

```env
IYZICO_API_KEY=
IYZICO_SECRET_KEY=
SMTP_HOST=
```

6. **Deploy** butonuna tıklayın

---

## Adım 3 — Doğrulama

Deploy tamamlandıktan sonra:

```bash
# DB bağlantısı ve şema init
curl https://SIZIN-URL.vercel.app/api/health
```

Beklenen yanıt:

```json
{ "success": true, "data": { "database": "connected" } }
```

İlk istekte şema tabloları otomatik oluşturulur ve seed katalog + admin kullanıcısı eklenir.

### Manuel kontrol listesi

- [ ] Ana sayfa açılıyor: `https://...vercel.app/`
- [ ] Ürünler listeleniyor: `/urunler`
- [ ] Admin girişi: `/admin` → `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- [ ] Sepete ürün eklenebiliyor
- [ ] `/api/health` → `"database": "connected"`

---

## Adım 4 — NEXT_PUBLIC_SITE_URL Güncelleme

İlk deploy'da placeholder URL kullandıysanız:

1. Vercel Dashboard → Project → **Settings** → **Environment Variables**
2. `NEXT_PUBLIC_SITE_URL` → gerçek URL'nizi yazın
3. **Deployments** → son deploy → **Redeploy**

Bu adım ödeme callback ve şifre sıfırlama linkleri için kritiktir.

---

## Adım 5 — Özel Domain (Opsiyonel)

1. Vercel → **Settings** → **Domains** → domain ekleyin
2. DNS kayıtlarını Vercel'in gösterdiği şekilde ayarlayın
3. `NEXT_PUBLIC_SITE_URL` → yeni domain ile güncelleyin

---

## Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| `/api/health` → database error | Neon connection bilgilerini kontrol edin; host'ta `?sslmode=require` olmamalı (sadece host adı) |
| Admin girişi çalışmıyor | `ADMIN_PASSWORD` env'i doğru mu? Production'da boş bırakılırsa admin seed atlanır |
| Ürünler görünmüyor | `/api/health` çağırın (seed tetiklenir); Neon SQL Editor'de `SELECT COUNT(*) FROM products` |
| Build hatası | Vercel loglarında `JWT_SECRET is not configured` → env eksik |
| Cold start yavaş | Neon free tier uyku modu; ilk istek 2-3 sn sürebilir (normal) |

---

## Güvenlik Kontrol Listesi (Production)

- [ ] `JWT_SECRET` en az 32 karakter, rastgele
- [ ] `ADMIN_PASSWORD` güçlü ve benzersiz
- [ ] Neon şifresi Vercel'de **Encrypted** olarak saklanıyor
- [ ] `.env.local` GitHub'a push edilmedi
- [ ] iyzico production key'leri yalnızca canlı ödeme gerekiyorsa eklenir

---

## Hızlı Referans — Vercel CLI (Alternatif)

```bash
npm i -g vercel
vercel login
vercel --prod

# Env eklemek için
vercel env add POSTGRES_HOST
vercel env add JWT_SECRET
# ... diğer değişkenler
```

---

*Deploy tamamlandıktan sonra `docs/linkedin/POST.md` dosyasındaki `[VERCEL_URL]` placeholder'ını gerçek URL'niz ile değiştirin.*
