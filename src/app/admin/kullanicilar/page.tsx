"use client";

import { useEffect, useState } from "react";
import type { User } from "@/types";
import { useAuth } from "@/context/AuthContext";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = () => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setUsers(json.data);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const setRole = async (id: string, role: "user" | "admin") => {
    setUpdatingId(id);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const json = await res.json();
    setUpdatingId(null);
    if (!json.success) {
      alert(json.message || "Rol güncellenemedi.");
      return;
    }
    load();
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Kullanıcı Yönetimi</h1>

      {loading ? (
        <p className="text-slate-500">Yükleniyor...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold">Ad Soyad</th>
                <th className="px-4 py-3 font-semibold">E-Posta</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 font-semibold">Kayıt Tarihi</th>
                <th className="px-4 py-3 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        user.role === "admin"
                          ? "bg-accent-100 text-accent-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {user.role === "admin" ? "Admin" : "Kullanıcı"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3">
                    {currentUser?.id === user.id ? (
                      <span className="text-xs text-slate-400">Siz</span>
                    ) : (
                      <button
                        type="button"
                        disabled={updatingId === user.id}
                        onClick={() =>
                          setRole(
                            user.id,
                            user.role === "admin" ? "user" : "admin"
                          )
                        }
                        className="text-xs font-medium text-primary-600 hover:underline disabled:opacity-50"
                      >
                        {updatingId === user.id
                          ? "..."
                          : user.role === "admin"
                            ? "Kullanıcı yap"
                            : "Admin yap"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
