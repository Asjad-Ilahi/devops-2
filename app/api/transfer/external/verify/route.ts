import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import jwt from "jsonwebtoken";

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
    if (!user.pendingExternalTransfer) {
      return NextResponse.json({ error: "No pending external transfer found" }, { status: 400 });
    }

    const timeElapsed = new Date().getTime() - user.pendingExternalTransfer.createdAt.getTime();
    if (timeElapsed > 15 * 60 * 1000) {
      user.pendingExternalTransfer = undefined;
      await user.save();
      return NextResponse.json({ error: "Verification code expired" }, { status: 401 });
    }

    if (user.pendingExternalTransfer.verificationCode !== verificationCode) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
    }

    const { from, amount, externalBankName, memo } = user.pendingExternalTransfer;

    // Update balance
    if (from === "checking") {
      user.balance -= amount;
    } else if (from === "savings") {
      user.savingsBalance -= amount;
    }

    // Create transaction record
    await Transaction.create({
      userId: user._id,
      description: memo || `External transfer to ${externalBankName}`,
      amount: -amount,
      type: "transfer",
      category: "External Transfer",
      accountType: from,
      status: "completed",
    });

    // Clear pending transfer
    user.pendingExternalTransfer = undefined;
    await user.save();

    return NextResponse.json({ message: "External transfer completed successfully" }, { status: 200 });
  } catch (error) {
    console.error("External transfer verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}