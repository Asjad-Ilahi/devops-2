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
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const transactions = await Transaction.find()
      .populate("userId", "fullName email")
      .sort({ date: -1 });

    const transferGroups = new Map();
    const singleTransactions = [];

    transactions.forEach((tx) => {
      if (tx.transferId) {
        const key = tx.transferId.toString();
        if (!transferGroups.has(key)) transferGroups.set(key, []);
        transferGroups.get(key).push(tx);
      } else {
        singleTransactions.push(tx);
      }
    });

    const getGroupStatus = (txs) => {
      if (txs.some((tx) => tx.status === "failed")) return "failed";
      if (txs.some((tx) => tx.status === "pending")) return "pending";
      return "completed";
    };

    const transferGroupObjects = Array.from(transferGroups.entries()).map(([transferId, txs]) => {
      const userIds = [...new Set(txs.map((tx) => tx.userId._id.toString()))];
      let transferType, description, fromAccount, toAccount, fromUserId, fromUserName, toUserId, toUserName;

      if (userIds.length === 1) {
        transferType = "internal";
        const userId = userIds[0];
        const fromTx = txs.find((tx) => tx.amount < 0);
        const toTx = txs.find((tx) => tx.amount > 0);
        fromAccount = fromTx?.accountType || "unknown";
        toAccount = toTx?.accountType || "unknown";
        fromUserName = fromTx?.userId.fullName || "Unknown";
        description = `Internal Transfer from ${fromAccount} to ${toAccount} for ${fromUserName}`;
      } else {
        transferType = "user-to-user";
        const fromTx = txs.find((tx) => tx.amount < 0);
        const toTx = txs.find((tx) => tx.amount > 0);
        fromUserId = fromTx?.userId._id.toString() || "unknown";
        fromUserName = fromTx?.userId.fullName || "Unknown";
        toUserId = toTx?.userId._id.toString() || "unknown";
        toUserName = toTx?.userId.fullName || "Unknown";
        description = `Transfer from ${fromUserName} to ${toUserName}`;
      }

      const amount = txs.find((tx) => tx.amount > 0)?.amount || Math.abs(txs[0].amount);
      const date = txs[0].date.toISOString();
      const status = getGroupStatus(txs);

      return {
        groupType: "transfer",
        transferId,
        transferType,
        description,
        amount,
        date,
        status,
        transactions: txs.map((tx) => ({
          id: tx._id.toString(),
          userId: tx.userId._id.toString(),
          userName: tx.userId.fullName,
          userEmail: tx.userId.email,
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          date: tx.date.toISOString(),
          status: tx.status,
          account: tx.accountType,
          memo: tx.memo,
          relatedTransactionId: tx.relatedTransactionId?.toString(),
        })),
        ...(transferType === "internal"
          ? { userId: userIds[0], fromAccount, toAccount }
          : { fromUserId, fromUserName, toUserId, toUserName }),
      };
    });

    const singleGroupObjects = singleTransactions.map((tx) => ({
      groupType: "single",
      transaction: {
        id: tx._id.toString(),
        userId: tx.userId._id.toString(),
        userName: tx.userId.fullName,
        userEmail: tx.userId.email,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        date: tx.date.toISOString(),
        status: tx.status,
        account: tx.accountType,
        memo: tx.memo,
        relatedTransactionId: tx.relatedTransactionId?.toString(),
      },
    }));

    const allGroups = [...transferGroupObjects, ...singleGroupObjects].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({ transactionGroups: allGroups });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();

  const token = req.cookies.get("adminToken")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, type, amount, memo } = await req.json();

    if (!userId || !type || !amount || !memo) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let balanceChange = parsedAmount;
    if (type === "withdrawal" || (type === "adjustment" && parsedAmount > 0)) {
      balanceChange = -parsedAmount;
    }

    user.balance = (user.balance || 0) + balanceChange;
    await user.save();

    const transaction = new Transaction({
      userId,
      type,
      amount: parsedAmount,
      description: memo,
      memo,
      date: new Date(),
      status: "completed",
      accountType: "checking",
    });

    await transaction.save();

    const transactionData = {
      id: transaction._id.toString(),
      userId: transaction.userId.toString(),
      userName: user.fullName,
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
  } catch (error) {
    console.error("Error processing transaction:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
