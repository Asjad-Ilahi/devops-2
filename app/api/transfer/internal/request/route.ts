import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";
import mongoose from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: NextRequest) {
  await dbConnect();
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { from, to, amount, memo } = await req.json();
    if (!from || !to || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!["checking", "savings"].includes(from) || !["checking", "savings"].includes(to)) {
      return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
    }
    if (from === to) {
      return NextResponse.json({ error: "Cannot transfer to the same account" }, { status: 400 });
    }

    const sourceBalance = from === "checking" ? user.balance : user.savingsBalance;
    if (sourceBalance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    if (user.twoFactorEnabled) {
      const verificationCode = crypto.randomBytes(3).toString("hex").toUpperCase();
      user.pendingTransfer = { from, to, amount, memo, verificationCode, createdAt: new Date() };
      await user.save();
      await sendVerificationEmail(user.email, verificationCode);
      return NextResponse.json(
        { message: "Verification code sent to your email", requiresVerification: true },
        { status: 200 }
      );
    } else {
      // Process transfer immediately
      if (from === "checking") user.balance -= amount;
      else user.savingsBalance -= amount;
      if (to === "checking") user.balance += amount;
      else user.savingsBalance += amount;

      const transferId = new mongoose.Types.ObjectId();
      await Transaction.create([
        {
          userId: user._id,
          description: memo || `Transfer from ${from} to ${to}`,
          amount: -amount,
          type: "transfer",
          category: "Transfer",
          accountType: from,
          status: "completed",
          transferId,
        },
        {
          userId: user._id,
          description: memo || `Transfer from ${from} to ${to}`,
          amount: amount,
          type: "transfer",
          category: "Transfer",
          accountType: to,
          status: "completed",
          transferId,
        },
      ]);

      await user.save();
      return NextResponse.json(
        { message: "Transfer successful", requiresVerification: false },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Internal transfer request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}