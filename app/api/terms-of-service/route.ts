import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Settings from "@/models/Settings";

export async function GET() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
    const settings = await Settings.findOne().select("termsOfService updatedAt siteName supportEmail supportPhone");
    
    if (!settings) {
      return NextResponse.json(
        { error: "Settings not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      termsOfService: settings.termsOfService,
      updatedAt: settings.updatedAt,
      siteName: settings.siteName,
      supportEmail: settings.supportEmail,
      supportPhone: settings.supportPhone,
    });
  } catch (error) {
    console.error("Error fetching terms of service:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}