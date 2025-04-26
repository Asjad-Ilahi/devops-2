import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();

  // Verify admin token
  const token = req.cookies.get("adminToken")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string; role?: string };
    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Await params to get the id
    const { id } = await params;
    const { twoFactorEnabled } = await req.json();

    if (typeof twoFactorEnabled !== "boolean") {
      return NextResponse.json({ error: "Invalid 2FA status" }, { status: 400 });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      id,
      { twoFactorEnabled },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: `2FA ${twoFactorEnabled ? "enabled" : "disabled"} successfully` });
  } catch (error) {
    console.error("Error updating 2FA:", error);
    return NextResponse.json({ error: "Failed to update 2FA" }, { status: 500 });
  }
}