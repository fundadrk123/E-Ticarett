import { Category } from "@/types";

export const categories: Category[] = [
  {
    id: "1",
    name: "El Aletleri",
    slug: "el-aletleri",
    icon: "🔧",
    productCount: 124,
    image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=900&h=700&fit=crop",
    description: "Delme, kesme ve montaj işlerinde güçlü çözüm",
  },
  {
    id: "2",
    name: "Hırdavat & Nalburiye",
    slug: "hirdavat-nalburiye",
    icon: "🔩",
    productCount: 256,
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=900&h=700&fit=crop",
    description: "Her türlü montaj ve bakım ihtiyacınız için geniş ürün yelpazesi",
  },
  {
    id: "3",
    name: "Elektrikli Makinalar",
    slug: "elektrikli-makinalar",
    icon: "⚡",
    productCount: 89,
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e787d9?w=900&h=700&fit=crop",
    description: "Profesyonel kullanım için güçlü ve verimli elektrikli ekipmanlar",
  },
  {
    id: "4",
    name: "Vida & Dübel",
    slug: "vida-dubel",
    icon: "📌",
    productCount: 178,
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&h=700&fit=crop",
    description: "Dayanıklı montaj çözümleri ve güvenli bağlantılar",
  },
  {
    id: "5",
    name: "Hortum & Bağlantı",
    slug: "hortum-baglanti",
    icon: "🔗",
    productCount: 67,
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=900&h=700&fit=crop",
    description: "Sıvı ve hava transferi için pratik bağlantı sistemleri",
  },
  {
    id: "6",
    name: "Kimyasal Grubu",
    slug: "kimyasal-grubu",
    icon: "🧪",
    productCount: 94,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&h=700&fit=crop",
    description: "Yapı ve bakım uygulamalarında güvenli kimyasal çözümler",
  },
  {
    id: "7",
    name: "İş Güvenliği",
    slug: "is-guvenligi",
    icon: "🦺",
    productCount: 45,
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=900&h=700&fit=crop",
    description: "İş yerinde güvenliği artıran koruyucu ekipmanlar",
  },
  {
    id: "8",
    name: "Bahçe Aletleri",
    slug: "bahce-aletleri",
    icon: "🌿",
    productCount: 72,
    image: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=900&h=700&fit=crop",
    description: "Bahçe bakımında pratik ve güçlü ürünler",
  },
  {
    id: "9",
    name: "Merdivenler",
    slug: "merdivenler",
    icon: "🪜",
    productCount: 28,
    image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=900&h=700&fit=crop",
    description: "Güvenli erişim için sağlam ve hafif merdivenler",
  },
  {
    id: "10",
    name: "Profil & Köşebent",
    slug: "profil-kosebent",
    icon: "📐",
    productCount: 56,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&h=700&fit=crop",
    description: "İnşaat projeleri için esnek yapı malzemeleri",
  },
  {
    id: "11",
    name: "Teller & Zincir",
    slug: "teller-zincir",
    icon: "⛓️",
    productCount: 41,
    image: "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=900&h=700&fit=crop",
    description: "Güçlü ve dayanıklı sabitleme çözümleri",
  },
  {
    id: "12",
    name: "Yapıştırıcı & Silikon",
    slug: "yapistirici-silikon",
    icon: "🧴",
    productCount: 63,
    image: "https://images.unsplash.com/photo-1600793433301-f2ff1a725684?w=900&h=700&fit=crop",
    description: "Hızlı ve sağlam yapıştırma çözümleri",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}
