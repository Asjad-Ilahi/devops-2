import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
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

    const { id } = await params;
    const transaction = await Transaction.findById(id).populate("userId", "fullName email");
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const transactionData = {
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
    };

    return NextResponse.json({ transaction: transactionData });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json({ error: "Failed to fetch transaction" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const body = await req.json();
    const { description, amount, type, status, memo, cryptoAmount, cryptoPrice } = body;

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const oldAmount = transaction.amount;
    const oldCryptoAmount = transaction.cryptoAmount;

    transaction.description = description || transaction.description;
    transaction.amount = amount !== undefined ? amount : transaction.amount;
    transaction.type = type || transaction.type;
    transaction.status = status || transaction.status;
    transaction.memo = memo !== undefined ? memo : transaction.memo;
    if (type === "crypto_buy" || type === "crypto_sell") {
      transaction.cryptoAmount = cryptoAmount !== undefined ? cryptoAmount : transaction.cryptoAmount;
      transaction.cryptoPrice = cryptoPrice !== undefined ? cryptoPrice : transaction.cryptoPrice;
    } else {
      transaction.cryptoAmount = undefined;
      transaction.cryptoPrice = undefined;
    }

    await transaction.save();

    const user = await User.findById(transaction.userId).select(
      "fullName email balance cryptoBalance savingsBalance"
    );
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (amount !== undefined && amount !== oldAmount) {
      if (transaction.accountType === "checking") {
        user.balance += amount - oldAmount;
      } else if (transaction.accountType === "savings") {
        user.savingsBalance += amount - oldAmount;
      }
    }

    if ((type === "crypto_buy" || type === "crypto_sell") && cryptoAmount !== undefined && cryptoAmount !== oldCryptoAmount) {
      const cryptoDelta = type === "crypto_buy" ? oldCryptoAmount - cryptoAmount : cryptoAmount - oldCryptoAmount;
      user.cryptoBalance += cryptoDelta;
    }

    await user.save();

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
      cryptoAmount: transaction.cryptoAmount,
      cryptoPrice: transaction.cryptoPrice,
    };

    return NextResponse.json({
      transaction: transactionData,
      userBalance: transaction.accountType === "savings" ? user.savingsBalance : user.balance,
      userCryptoBalance: user.cryptoBalance,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const originalTransaction = await Transaction.findById(id);
    if (!originalTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (originalTransaction.type === "refund") {
      return NextResponse.json({ error: "Cannot refund a refund transaction" }, { status: 400 });
    }

    const existingRefund = await Transaction.findOne({ relatedTransactionId: originalTransaction._id });
    if (existingRefund) {
      return NextResponse.json({ error: "Transaction already refunded" }, { status: 400 });
    }

    let refundTransactions = [];
    let usersToUpdate = new Set<string>();

    if (originalTransaction.type === "transfer" && originalTransaction.relatedTransactionId) {
      const relatedTransaction = await Transaction.findById(originalTransaction.relatedTransactionId);
      if (
        relatedTransaction &&
        relatedTransaction.type === "transfer" &&
        relatedTransaction.relatedTransactionId.toString() === originalTransaction._id.toString()
      ) {
        // Refund both transactions
        const refund1 = new Transaction({
          userId: originalTransaction.userId,
          description: `Refund for ${originalTransaction.description}`,
          amount: -originalTransaction.amount,
          date: new Date(),
          type: "refund",
          category: originalTransaction.category,
          accountType: originalTransaction.accountType,
          status: "completed",
          memo: `Refund for transaction ${originalTransaction._id}`,
          relatedTransactionId: originalTransaction._id,
        });
        const refund2 = new Transaction({
          userId: relatedTransaction.userId,
          description: `Refund for ${relatedTransaction.description}`,
          amount: -relatedTransaction.amount,
          date: new Date(),
          type: "refund",
          category: relatedTransaction.category,
          accountType: relatedTransaction.accountType,
          status: "completed",
          memo: `Refund for transaction ${relatedTransaction._id}`,
          relatedTransactionId: relatedTransaction._id,
        });
        refundTransactions.push(refund1, refund2);
        usersToUpdate.add(originalTransaction.userId.toString());
        usersToUpdate.add(relatedTransaction.userId.toString());
      } else {
        // Refund only the original transaction
        const refund = new Transaction({
          userId: originalTransaction.userId,
          description: `Refund for ${originalTransaction.description}`,
          amount: -originalTransaction.amount,
          date: new Date(),
          type: "refund",
          category: originalTransaction.category,
          accountType: originalTransaction.accountType,
          status: "completed",
          memo: `Refund for transaction ${originalTransaction._id}`,
          relatedTransactionId: originalTransaction._id,
        });
        refundTransactions.push(refund);
        usersToUpdate.add(originalTransaction.userId.toString());
      }
    } else {
      // Regular refund
      const refund = new Transaction({
        userId: originalTransaction.userId,
        description: `Refund for ${originalTransaction.description}`,
        amount: -originalTransaction.amount,
        date: new Date(),
        type: "refund",
        category: originalTransaction.category,
        accountType: originalTransaction.accountType,
        status: "completed",
        memo: `Refund for transaction ${originalTransaction._id}`,
        relatedTransactionId: originalTransaction._id,
      });
      refundTransactions.push(refund);
      usersToUpdate.add(originalTransaction.userId.toString());
    }

    // Save refund transactions
    await Promise.all(refundTransactions.map((tx) => tx.save()));

    // Update users' balances
    for (const userId of usersToUpdate) {
      const user = await User.findById(userId);
      if (user) {
        const userRefunds = refundTransactions.filter((tx) => tx.userId.toString() === userId);
        for (const refund of userRefunds) {
          if (refund.accountType === "checking") {
            user.balance += refund.amount;
          } else if (refund.accountType === "savings") {
            user.savingsBalance += refund.amount;
          } else if (refund.accountType === "crypto") {
            user.cryptoBalance += refund.cryptoAmount || 0;
          }
        }
        await user.save();
      }
    }

    // Prepare response
    const response = {
      message: "Refund processed successfully",
      refundTransactions: refundTransactions.map((tx) => ({
        id: tx._id.toString(),
        userId: tx.userId.toString(),
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        date: tx.date.toISOString(),
        status: tx.status,
        account: tx.accountType,
        memo: tx.memo,
        relatedTransactionId: tx.relatedTransactionId?.toString(),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json({ error: "Failed to process refund" }, { status: 500 });
  }
}