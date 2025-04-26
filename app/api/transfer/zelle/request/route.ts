import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: NextRequest) {
  await dbConnect();
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const sender = await User.findById(decoded.userId);
    if (!sender) {
      return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    }

    const { recipient, amount, memo } = await req.json();
    if (!recipient || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { type, value } = recipient;
    if (type !== "email" && type !== "phone") {
      return NextResponse.json({ error: "Invalid recipient type" }, { status: 400 });
    }

    const recipientUser = await User.findOne({ [type]: value });
    if (!recipientUser) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    if (recipientUser._id.toString() === sender._id.toString()) {
      return NextResponse.json({ error: "Cannot send money to yourself" }, { status: 400 });
    }

    if (sender.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    const verificationCode = crypto.randomBytes(3).toString("hex").toUpperCase();
    sender.pendingZelleTransfer = {
      recipientId: recipientUser._id.toString(),
      amount,
      memo,
      verificationCode,
      createdAt: new Date(),
    };
    await sender.save();

    await sendVerificationEmail(sender.email, verificationCode);

    return NextResponse.json({ message: "Verification code sent to your email" }, { status: 200 });
  } catch (error) {
    console.error("Zelle transfer request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}