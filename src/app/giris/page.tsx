"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Mail, Lock, Eye, EyeOff, Phone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Suspense } from "react";

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/hesabim";
  const initialRegister = searchParams.get("mode") === "register";
  const [isLogin, setIsLogin] = useState(!initialRegister);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();
  const isCheckoutRedirect = redirect.startsWith("/odeme");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = isLogin
      ? await login(email, password)
      : await register({ email, password, name, phone: phone || undefined });

    setLoading(false);

    if (result.success) {
      router.push(redirect);
      router.refresh();
    } else {
      setError(result.message || "İşlem başarısız.");
    }
  };

  return (
    <div className="container-site py-12 lg:py-16">
      <div className="mx-auto max-w-md">
        <div className="card p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-500 text-xl font-bold text-white">
              MG
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              {isLogin ? "Giriş Yap" : "Hesap Oluştur"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isCheckoutRedirect
                ? isLogin
                  ? "Giriş yaptıktan sonra siparişinizi tamamlayabilirsiniz"
                  : "Kayıt olduktan sonra siparişinizi tamamlayabilirsiniz"
                : isLogin
                  ? "Hesabınıza giriş yaparak alışverişe devam edin"
                  : "Yeni hesap oluşturarak toptan fiyatlardan yararlanın"}
            </p>
          </div>

          {isCheckoutRedirect && (
            <div className="mb-4 rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-800">
              Sepetiniz korunuyor. Giriş veya kayıt sonrası ödeme sayfasına
              yönlendirileceksiniz.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Ad Soyad
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Adınız Soyadınız"
                      className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Telefon
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                E-Posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-3 disabled:opacity-60"
            >
              {loading
                ? "Lütfen bekleyin..."
                : isLogin
                  ? "Giriş Yap ve Devam Et"
                  : "Kayıt Ol ve Devam Et"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? "Hesabınız yok mu?" : "Zaten hesabınız var mı?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="font-semibold text-primary-600 hover:text-primary-700"
            >
              {isLogin ? "Hesap Oluştur" : "Giriş Yap"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container-site py-16 text-center">Yükleniyor...</div>}>
      <LoginForm />
    </Suspense>
  );
}
