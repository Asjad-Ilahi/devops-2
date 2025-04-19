import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();

  const token = req.cookies.get("adminToken")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string; role?: string };
    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Await params to get the id
    const { id } = await params;
    const userId = id;

    // Fetch transactions for the user
    const transactions = await Transaction.find({ userId })
      .populate("userId", "fullName email")
      .sort({ date: -1 });

    const transactionData = transactions.map((transaction) => ({
      id: transaction._id.toString(),
      userId: transaction.userId._id.toString(),
      userName: transaction.userId.fullName,
      userEmail: transaction.userId.email,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      date: transaction.date.toISOString(),
      status: transaction.status,
      account: transaction.accountType,
      memo: transaction.memo,
      relatedTransactionId: transaction.relatedTransactionId?.toString(),
      cryptoAmount: transaction.cryptoAmount,
      cryptoPrice: transaction.cryptoPrice,
    }));

    return NextResponse.json({ transactions: transactionData });
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}