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

    if (sender.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    if (sender.twoFactorEnabled) {
      const verificationCode = crypto.randomBytes(3).toString("hex").toUpperCase();
      sender.pendingZelleTransfer = {
        recipientId: recipientUser ? recipientUser._id.toString() : null,
        recipientType: type,
        recipientValue: value,
        amount,
        memo,
        verificationCode,
        createdAt: new Date(),
      };
      await sender.save();
      await sendVerificationEmail(sender.email, verificationCode);
      return NextResponse.json(
        { message: "Verification code sent to your email", requiresVerification: true },
        { status: 200 }
      );
    } else {
      // Process transfer immediately
      if (recipientUser) {
        // Internal transfer: recipient exists
        if (recipientUser._id.toString() === sender._id.toString()) {
          return NextResponse.json({ error: "Cannot send money to yourself" }, { status: 400 });
        }
        sender.balance -= amount;
        recipientUser.balance += amount;

        const transferId = new mongoose.Types.ObjectId();
        await Transaction.create([
          {
            userId: sender._id,
            description: memo || `Zelle transfer to ${recipientUser.fullName || recipientUser.email || recipientUser.phone}`,
            amount: -amount,
            type: "transfer",
            category: "Zelle",
            accountType: "checking",
            status: "completed",
            transferId,
          },
          {
            userId: recipientUser._id,
            description: memo || `Zelle transfer from ${sender.fullName || sender.email || sender.phone}`,
            amount: amount,
            type: "deposit",
            category: "Zelle",
            accountType: "checking",
            status: "completed",
            transferId,
          },
        ]);

        await Promise.all([sender.save(), recipientUser.save()]);
      } else {
        // External transfer: recipient does not exist
        sender.balance -= amount;

        await Transaction.create({
          userId: sender._id,
          description: memo || `Zelle transfer to external recipient: ${value}`,
          amount: -amount,
          type: "transfer",
          category: "Zelle External",
          accountType: "checking",
          status: "completed",
        });

        await sender.save();
      }
      return NextResponse.json(
        { message: "Zelle transfer completed successfully", requiresVerification: false },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Zelle transfer request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}