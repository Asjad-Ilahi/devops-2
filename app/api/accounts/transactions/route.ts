import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "";

export async function GET(req: NextRequest) {
  await dbConnect();
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { searchParams } = new URL(req.url);
    const accountType = searchParams.get("accountType");

    if (!accountType || !["checking", "savings", "crypto"].includes(accountType)) {
      return NextResponse.json({ error: "Invalid or missing accountType parameter" }, { status: 400 });
    }

    const transactions = await Transaction.find({
      userId: decoded.userId,
      accountType,
    })
      .sort({ date: -1 })
      .limit(10)
      .lean()
      .exec();

    // Ensure consistent transaction data structure
    const formattedTransactions = transactions.map((tx) => ({
      id: tx._id.toString(),
      description: tx.description || "Unknown Transaction",
      amount: tx.amount || 0,
      date: tx.date ? new Date(tx.date).toISOString() : new Date().toISOString(),
      type: tx.type || "unknown",
      accountType: tx.accountType || accountType,
    }));

    return NextResponse.json({ transactions: formattedTransactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}