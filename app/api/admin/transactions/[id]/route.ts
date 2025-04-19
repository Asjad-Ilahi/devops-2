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
    const body = await req.json();
    const { relatedTransferId } = body;

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

    const user = await User.findById(originalTransaction.userId).select(
      "fullName email balance savingsBalance cryptoBalance accountNumber savingsNumber"
    );
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine refund amount and crypto amount
    let refundAmount = -originalTransaction.amount;
    let refundCryptoAmount = 0;

    if (originalTransaction.type === "crypto_buy") {
      refundCryptoAmount = -(originalTransaction.cryptoAmount || 0); // Deduct BTC
    } else if (originalTransaction.type === "crypto_sell") {
      refundCryptoAmount = originalTransaction.cryptoAmount || 0; // Add BTC
    }

    const refundTransaction = new Transaction({
      userId: originalTransaction.userId,
      description: `Refund for ${originalTransaction.description}`,
      amount: refundAmount,
      date: new Date(),
      type: "refund",
      category: originalTransaction.category,
      accountType: originalTransaction.accountType,
      status: "completed",
      memo: `Refund for transaction ${originalTransaction._id}`,
      relatedTransactionId: originalTransaction._id,
      cryptoAmount: refundCryptoAmount || undefined,
      cryptoPrice: originalTransaction.cryptoPrice || undefined,
    });

    await refundTransaction.save();

    // Update user balance based on account type
    if (originalTransaction.accountType === "checking") {
      user.balance += refundAmount;
    } else if (originalTransaction.accountType === "savings") {
      user.savingsBalance += refundAmount;
    }
    if (refundCryptoAmount) {
      user.cryptoBalance += refundCryptoAmount;
    }

    // Handle paired transfer (checking-to-savings or savings-to-checking)
    let relatedRefund = null;
    if (relatedTransferId) {
      const pairedTransaction = await Transaction.findById(relatedTransferId);
      if (
        pairedTransaction &&
        pairedTransaction.userId.toString() === originalTransaction.userId.toString() &&
        pairedTransaction.type === "transfer" &&
        Math.abs(pairedTransaction.amount) === Math.abs(originalTransaction.amount) &&
        pairedTransaction.amount === -originalTransaction.amount &&
        new Date(pairedTransaction.date).getTime() === new Date(originalTransaction.date).getTime()
      ) {
        const pairedRefund = new Transaction({
          userId: pairedTransaction.userId,
          description: `Refund for ${pairedTransaction.description}`,
          amount: -pairedTransaction.amount,
          date: new Date(),
          type: "refund",
          category: pairedTransaction.category,
          accountType: pairedTransaction.accountType,
          status: "completed",
          memo: `Refund for transaction ${pairedTransaction._id} (paired with ${originalTransaction._id})`,
          relatedTransactionId: pairedTransaction._id,
        });

        await pairedRefund.save();

        // Update the opposite account balance
        if (pairedTransaction.accountType === "checking") {
          user.balance += pairedRefund.amount;
        } else if (pairedTransaction.accountType === "savings") {
          user.savingsBalance += pairedRefund.amount;
        }

        relatedRefund = {
          id: pairedRefund._id.toString(),
          userId: pairedTransaction.userId.toString(),
          userName: user.fullName,
          userEmail: user.email,
          type: pairedRefund.type,
          amount: pairedRefund.amount,
          description: pairedRefund.description,
          date: pairedRefund.date.toISOString(),
          status: pairedRefund.status,
          account: pairedRefund.accountType,
          memo: pairedRefund.memo,
          relatedTransactionId: pairedRefund.relatedTransactionId?.toString(),
        };
      }
    }

    await user.save();

    const refundData = {
      id: refundTransaction._id.toString(),
      userId: refundTransaction.userId.toString(),
      userName: user.fullName,
      userEmail: user.email,
      type: refundTransaction.type,
      amount: refundTransaction.amount,
      description: refundTransaction.description,
      date: refundTransaction.date.toISOString(),
      status: refundTransaction.status,
      account: refundTransaction.accountType,
      memo: refundTransaction.memo,
      relatedTransactionId: refundTransaction.relatedTransactionId?.toString(),
      cryptoAmount: refundTransaction.cryptoAmount,
      cryptoPrice: refundTransaction.cryptoPrice,
    };

    return NextResponse.json({
      transaction: refundData,
      userBalance: refundTransaction.accountType === "savings" ? user.savingsBalance : user.balance,
      userCryptoBalance: user.cryptoBalance,
      relatedRefund,
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json({ error: "Failed to process refund" }, { status: 500 });
  }
}