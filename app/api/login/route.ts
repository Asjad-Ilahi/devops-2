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
    const { username, password, twoFactorCode, step } = await req.json();

    if (!step || !["requestCode", "verifyCode"].includes(step)) {
      return NextResponse.json({ error: "Invalid or missing step parameter" }, { status: 400 });
    }

    if (step === "requestCode") {
      if (!username || !password) {
        return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
      }

      const user = await User.findOne({ username });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (user.status !== "active") {
        return NextResponse.json({ error: "Account is not active" }, { status: 403 });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const twoFactorCode = crypto.randomBytes(3).toString("hex").toUpperCase();
      user.twoFactorCode = twoFactorCode;
      await user.save();

      await sendVerificationEmail(user.email, twoFactorCode);

      return NextResponse.json({ message: "Verification code sent to your email" }, { status: 200 });
    } else if (step === "verifyCode") {
      if (!username || !twoFactorCode) {
        return NextResponse.json({ error: "Username and verification code are required" }, { status: 400 });
      }

      const user = await User.findOne({ username });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (user.twoFactorCode !== twoFactorCode) {
        return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
      }

      user.twoFactorCode = undefined;
      user.lastLogin = new Date();
      await user.save();

      const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET!, { expiresIn: "1h" });

      return NextResponse.json({ token, redirect: "/dashboard" }, { status: 200 });
    }
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during login" },
      { status: 500 }
    );
  }
}