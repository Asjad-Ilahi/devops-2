import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import jwt from "jsonwebtoken";
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
    const sender = await User.findById(decoded.userId);
    if (!sender) {
      return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    }

    const { verificationCode } = await req.json();
    if (!sender.pendingZelleTransfer) {
      return NextResponse.json({ error: "No pending Zelle transfer found" }, { status: 400 });
    }

    const timeElapsed = new Date().getTime() - sender.pendingZelleTransfer.createdAt.getTime();
    if (timeElapsed > 15 * 60 * 1000) {
      sender.pendingZelleTransfer = undefined;
      await sender.save();
      return NextResponse.json({ error: "Verification code expired" }, { status: 401 });
    }

    if (sender.pendingZelleTransfer.verificationCode !== verificationCode) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
    }

    const { recipientId, amount, memo } = sender.pendingZelleTransfer;
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    sender.balance -= amount;
    recipient.balance += amount;

    const transferId = new mongoose.Types.ObjectId();
    await Transaction.create([
      {
        userId: sender._id,
        description: memo || `Zelle transfer to ${recipient.fullName || recipient.email || recipient.phone}`,
        amount: -amount,
        type: "transfer",
        category: "Zelle",
        accountType: "checking",
        status: "completed",
        transferId,
      },
      {
        userId: recipient._id,
        description: memo || `Zelle transfer from ${sender.fullName || sender.email || sender.phone}`,
        amount: amount,
        type: "deposit",
        category: "Zelle",
        accountType: "checking",
        status: "completed",
        transferId,
      },
    ]);

    sender.pendingZelleTransfer = undefined;
    await Promise.all([sender.save(), recipient.save()]);

    return NextResponse.json({ message: "Zelle transfer completed successfully" }, { status: 200 });
  } catch (error) {
    console.error("Zelle transfer verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}