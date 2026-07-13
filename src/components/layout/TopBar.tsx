import Link from "next/link";
import { siteConfig } from "@/data/site";
import { Phone, Mail, Clock } from "lucide-react";

export function TopBar() {
  return (
    <div className="hidden border-b border-primary-700 bg-primary-800 text-sm text-primary-100 lg:block">
      <div className="container-site flex items-center justify-between py-2">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" />
            {siteConfig.phone}
          </span>
          <span className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            {siteConfig.email}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {siteConfig.workingHours}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/siparis-takip" className="hover:text-white transition">
            Sipariş Takibi
          </Link>
          <Link href="/yardim" className="hover:text-white transition">
            Yardım
          </Link>
        </div>
      </div>
    </div>
  );
}
