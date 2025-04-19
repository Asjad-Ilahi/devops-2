// app/api/admin/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(req: NextRequest) {
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

    // Populate userId with "fullName email" instead of "name email"
    const transactions = await Transaction.find()
      .populate("userId", "fullName email")
      .limit(50);

    // Map transactions, using fullName instead of name
    const transactionsData = transactions.map((tx) => ({
      id: tx._id.toString(),
      userId: tx.userId?._id?.toString() || "Unknown",
      userName: tx.userId?.fullName || "Unknown User", // Changed from "name" to "fullName"
      userEmail: tx.userId?.email || "N/A",
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      date: tx.date.toISOString(),
      status: tx.status,
      account: tx.accountType,
      memo: tx.memo,
      relatedTransactionId: tx.relatedTransactionId?.toString(),
    }));

    return NextResponse.json({ transactions: transactionsData });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();

  const token = req.cookies.get("adminToken")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string; role: string };
    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { userId, type, amount, memo } = await req.json();

    if (!userId || !type || !amount || !memo) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate balance change
    let balanceChange = parsedAmount;
    if (type === "withdrawal" || (type === "adjustment" && parsedAmount > 0)) {
      balanceChange = -parsedAmount;
    }

    // Update user balance
    user.balance = (user.balance || 0) + balanceChange;
    await user.save();

    // Create and save transaction
    const transaction = new Transaction({
      userId,
      type,
      amount: parsedAmount,
      description: memo,
      memo,
      date: new Date(),
      status: "completed",
      accountType: "checking", // Default to checking account
    });

    await transaction.save();

    // Use fullName instead of name in the response
    const transactionData = {
      id: transaction._id.toString(),
      userId: transaction.userId.toString(),
      userName: user.fullName, // Changed from "name" to "fullName"
      userEmail: user.email,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      date: transaction.date.toISOString(),
      status: transaction.status,
      account: transaction.accountType,
      memo: transaction.memo,
      relatedTransactionId: transaction.relatedTransactionId?.toString(),
    };

    return NextResponse.json({
      message: "Transaction completed successfully",
      transaction: transactionData,
      newBalance: user.balance,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error processing transaction:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}