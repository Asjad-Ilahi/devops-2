import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, step, currentPassword, newPassword, verificationCode } = await req.json();

    if (!step || !["requestCode", "verifyCode"].includes(step)) {
      return NextResponse.json({ error: "Invalid or missing step parameter" }, { status: 400 });
    }

    if (step === "requestCode") {
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (user.status !== "active") {
        return NextResponse.json({ error: "Account is not active" }, { status: 403 });
      }

      // For profile page, verify current password if provided
      if (currentPassword) {
        const token = req.headers.get("Authorization")?.split(" ")[1];
        if (!token) {
          return NextResponse.json({ error: "Authentication token required" }, { status: 401 });
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
          return NextResponse.json({ error: "Invalid current password" }, { status: 401 });
        }
      }

      const twoFactorCode = crypto.randomBytes(3).toString("hex").toUpperCase();
      user.twoFactorCode = twoFactorCode;
      await user.save();

      await sendVerificationEmail(user.email, twoFactorCode);

      return NextResponse.json({ message: "Verification code sent to your email" }, { status: 200 });
    } else if (step === "verifyCode") {
      if (!email || !verificationCode || !newPassword) {
        return NextResponse.json(
          { error: "Email, verification code, and new password are required" },
          { status: 400 }
        );
      }

      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (user.twoFactorCode !== verificationCode) {
        return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.twoFactorCode = undefined;
      await user.save();

      // For profile page, return token if authenticated
      const token = req.headers.get("Authorization")?.split(" ")[1];
      if (token) {
        const newToken = jwt.sign({ userId: user._id.toString() }, JWT_SECRET!, { expiresIn: "1h" });
        return NextResponse.json({ message: "Password changed successfully", token }, { status: 200 });
      }

      return NextResponse.json({ message: "Password reset successfully" }, { status: 200 });
    }
  } catch (error: any) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}