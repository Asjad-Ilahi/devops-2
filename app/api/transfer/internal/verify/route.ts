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
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { verificationCode } = await req.json();
    if (!user.pendingTransfer) {
      return NextResponse.json({ error: "No pending transfer found" }, { status: 400 });
    }

    if ((new Date().getTime() - user.pendingTransfer.createdAt.getTime()) > 15 * 60 * 1000) {
      user.pendingTransfer = undefined;
      await user.save();
      return NextResponse.json({ error: "Verification code expired" }, { status: 401 });
    }

    if (user.pendingTransfer.verificationCode !== verificationCode) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
    }

    const { from, to, amount, memo } = user.pendingTransfer;

    // Update balances
    if (from === "checking") user.balance -= amount;
    else user.savingsBalance -= amount;
    if (to === "checking") user.balance += amount;
    else user.savingsBalance += amount;

    // Generate a transferId to link the sender and receiver transactions
    const transferId = new mongoose.Types.ObjectId();

    // Create transaction records with the same transferId
    await Transaction.create([
      {
        userId: user._id,
        description: memo || `Transfer from ${from} to ${to}`,
        amount: -amount,
        type: "transfer",
        category: "Transfer",
        accountType: from,
        status: "completed",
        transferId, // Add transferId to sender transaction
      },
      {
        userId: user._id,
        description: memo || `Transfer from ${from} to ${to}`,
        amount: amount,
        type: "transfer",
        category: "Transfer",
        accountType: to,
        status: "completed",
        transferId, // Add transferId to receiver transaction
      },
    ]);

    // Clear pending transfer
    user.pendingTransfer = undefined;
    await user.save();

    return NextResponse.json({ message: "Transfer successful" }, { status: 200 });
  } catch (error) {
    console.error("Internal transfer verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}