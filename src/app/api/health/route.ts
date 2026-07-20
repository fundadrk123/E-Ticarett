import { NextResponse } from "next/server";
import { testConnection, initializeDatabase } from "@/lib/db/postgres";

export async function GET() {
  try {
    const connected = await testConnection();
    if (!connected) {
      return NextResponse.json(
        {
          success: false,
          status: "db_error",
          message: "PostgreSQL bağlantısı kurulamadı.",
        },
        { status: 503 }
      );
    }
    await initializeDatabase();
    return NextResponse.json({
      success: true,
      status: "ok",
      service: "mertem-grup-eticaret-api",
      database: "postgresql",
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        success: false,
        status: "error",
        message: "Veritabanı bağlantı hatası.",
      },
      { status: 503 }
    );
  }
}
