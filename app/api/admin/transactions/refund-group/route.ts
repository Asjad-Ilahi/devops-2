import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "";

export async function POST(req: NextRequest) {
  await dbConnect();
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    jwt.verify(token, JWT_SECRET); // Verify admin access
    const { groupId } = await req.json();

    const transactions = await Transaction.find({ transferId: groupId });
    if (transactions.length !== 2) {
      return NextResponse.json({ error: "Invalid group transaction" }, { status: 400 });
    }

    const senderTx = transactions.find((tx) => tx.amount < 0);
    const receiverTx = transactions.find((tx) => tx.amount > 0);
    if (!senderTx || !receiverTx) {
      return NextResponse.json({ error: "Invalid group transaction" }, { status: 400 });
    }

    // Check for existing refunds
    const refundCheck = await Transaction.find({
      $or: [
        { relatedTransactionId: senderTx.id, type: "refund" },
        { relatedTransactionId: receiverTx.id, type: "refund" },
      ],
    });
    if (refundCheck.length > 0) {
      return NextResponse.json({ error: "Group already refunded" }, { status: 400 });
    }

    const sender = await User.findById(senderTx.userId);
    const receiver = await User.findById(receiverTx.userId);
    if (!sender || !receiver) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const refundTransactions = [
      {
        userId: senderTx.userId,
        userName: sender.fullName,
        userEmail: sender.email,
        description: `Refund for ${senderTx.description}`,
        amount: Math.abs(senderTx.amount),
        date: new Date(),
        type: "refund",
        status: "completed",
        account: senderTx.account,
        relatedTransactionId: senderTx.id,
        transferId: senderTx.transferId,
      },
      {
        userId: receiverTx.userId,
        userName: receiver.fullName,
        userEmail: receiver.email,
        description: `Refund deduction for ${receiverTx.description}`,
        amount: -Math.abs(receiverTx.amount),
        date: new Date(),
        type: "refund",
        status: "completed",
        account: receiverTx.account,
        relatedTransactionId: receiverTx.id,
        transferId: receiverTx.transferId,
      },
    ];

    await Transaction.insertMany(refundTransactions);
    sender.balance += Math.abs(senderTx.amount);
    receiver.balance -= Math.abs(receiverTx.amount);
    await Promise.all([sender.save(), receiver.save()]);

    return NextResponse.json({ message: "Group refunded successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error refunding group:", error);
    return NextResponse.json({ error: "Failed to refund group" }, { status: 500 });
  }
}