import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PendingUser from "@/models/pendingUser";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { pendingUserId, username, password } = await req.json();

    // Validate input
    if (!pendingUserId || !username || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find and validate user
    const pendingUser = await PendingUser.findById(pendingUserId);
    if (!pendingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!pendingUser.isVerified) {
      return NextResponse.json({ error: "Email not verified" }, { status: 400 });
    }

    // Check for username uniqueness
    const existingUser = await PendingUser.findOne({ username });
    if (existingUser && existingUser._id.toString() !== pendingUserId) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    // Update user
    const hashedPassword = await bcrypt.hash(password, 10);
    pendingUser.username = username;
    pendingUser.password = hashedPassword;
    pendingUser.adminVerified = false;
    pendingUser.twoFactorCode = undefined; // Clear twoFactorCode after registration
    await pendingUser.save();

    return NextResponse.json(
      { message: "Registration completed, awaiting admin approval" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in complete-registration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}