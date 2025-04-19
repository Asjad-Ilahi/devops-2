import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PendingUser from "@/models/pendingUser";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { pendingUserId, code } = await req.json();

    if (!pendingUserId || !code) {
      return NextResponse.json({ error: "Missing user ID or code" }, { status: 400 });
    }

    const pendingUser = await PendingUser.findById(pendingUserId);
    if (!pendingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (pendingUser.verificationCode !== code) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    pendingUser.isVerified = true;
    await pendingUser.save();

    return NextResponse.json({ message: "Email verified successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}