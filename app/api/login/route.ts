// app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: NextRequest) {
  await dbConnect();
  const { username, password, twoFactorCode, step } = await req.json();

  if (step === "requestCode") {
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
      }

      if (!user.isApproved) {
        return NextResponse.json({ error: "Account not yet approved" }, { status: 403 });
      }

      const verificationCode = crypto.randomBytes(3).toString("hex").toUpperCase();
      user.twoFactorCode = verificationCode;
      user.twoFactorCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save();

      if (user.verificationMethod === "email") {
        await sendVerificationEmail(user.email, verificationCode);
      }

      return NextResponse.json({
        message: "Verification code sent",
        verificationMethod: user.verificationMethod,
        phone: user.verificationMethod === "phone" ? user.phone : undefined,
      });
    } catch (error) {
      console.error("Login error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  } else if (step === "verifyCode") {
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return NextResponse.json({ error: "Invalid username" }, { status: 401 });
      }

      if (!user.twoFactorCode || user.twoFactorCode !== twoFactorCode || user.twoFactorCodeExpires < new Date()) {
        return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 401 });
      }

      user.twoFactorCode = null;
      user.twoFactorCodeExpires = null;
      await user.save();

      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
      return NextResponse.json({ token, redirect: "/dashboard" });
    } catch (error) {
      console.error("Verification error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid step" }, { status: 400 });
}