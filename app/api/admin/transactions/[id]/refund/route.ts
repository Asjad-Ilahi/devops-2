import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Ensure JWT_SECRET is set
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}

// Middleware to verify admin token
async function verifyAdminToken(req: NextRequest) {
  console.log("DEBUG: Verifying admin token...");
  const token = req.cookies.get("adminToken")?.value;
  console.log("DEBUG: Token received:", token || "No token");

  if (!token) {
    console.log("DEBUG: No token found, returning 401");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string; role?: string };
    console.log("DEBUG: Token decoded:", decoded);

    if (decoded.role !== "admin") {
      console.log("DEBUG: Role is not admin, returning 403");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.log("DEBUG: Token verification successful");
    return null; // Token is valid
  } catch (error) {
    console.error("DEBUG: Error verifying token:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log("DEBUG: Starting POST handler for refund...");
  await dbConnect();

  // Verify admin token
  const authResponse = await verifyAdminToken(req);
  if (authResponse) return authResponse;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Parse request body
    console.log("DEBUG: Parsing request body...");
    const body = await req.json();
    console.log("DEBUG: Request body:", body);

    const { senderTransactionId, receiverTransactionId, isInternalTransfer } = body;
    console.log("DEBUG: Sender Transaction ID:", senderTransactionId);
    console.log("DEBUG: Receiver Transaction ID:", receiverTransactionId || "Not provided");
    console.log("DEBUG: Is Internal Transfer:", isInternalTransfer);

    const { id } = await params;
    console.log("DEBUG: URL Param ID:", id);

    // Validate senderTransactionId matches the URL param
    if (senderTransactionId !== id) {
      console.log("DEBUG: Sender Transaction ID does not match URL param ID");
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json({ error: "Sender Transaction ID mismatch" }, { status: 400 });
    }

    // Fetch transactions
    const transactionIdsToRefund = [senderTransactionId];
    if (receiverTransactionId) transactionIdsToRefund.push(receiverTransactionId);
    console.log("DEBUG: Transactions to refund:", transactionIdsToRefund);

    const transactions = await Transaction.find({ _id: { $in: transactionIdsToRefund } })
      .populate("userId")
      .session(session);
    console.log("DEBUG: Fetched transactions:", JSON.stringify(transactions, null, 2));

    if (transactions.length !== transactionIdsToRefund.length) {
      console.log("DEBUG: Not all transactions found");
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json({ error: "One or more transactions not found" }, { status: 404 });
    }

    const refundTransactions = [];
    const usersToUpdate = new Map<string, { balanceChange: number; savingsBalanceChange: number }>();

    if (isInternalTransfer) {
      // Handle internal transfer refund
      console.log("DEBUG: Processing internal transfer refund...");
      const senderTx = transactions.find((tx) => tx.amount < 0);
      const receiverTx = transactions.find((tx) => tx.amount > 0);

      if (!senderTx || !receiverTx) {
        console.log("DEBUG: Invalid internal transfer: missing sender or receiver transaction");
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({ error: "Invalid internal transfer" }, { status: 400 });
      }

      // Check if already refunded
      const existingRefund = await Transaction.findOne({
        relatedTransactionId: { $in: [senderTx._id, receiverTx._id] },
      }).session(session);
      if (existingRefund) {
        console.log("DEBUG: Transaction already refunded");
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({ error: "Transaction already refunded" }, { status: 400 });
      }

      // Create two refund transactions to reverse the transfer
      const refundSender = new Transaction({
        userId: senderTx.userId._id,
        description: `Refund for ${senderTx.description}`,
        amount: Math.abs(senderTx.amount), // Credit the source account
        date: new Date(),
        type: "transfer",
        category: "Transfer",
        accountType: senderTx.accountType, // Original source account (e.g., savings)
        status: "completed",
        memo: `Refund for transaction ${senderTx._id}`,
        relatedTransactionId: senderTx._id,
        transferId: new mongoose.Types.ObjectId(), // New transferId for the refund pair
      });

      const refundReceiver = new Transaction({
        userId: receiverTx.userId._id,
        description: `Refund for ${receiverTx.description}`,
        amount: -Math.abs(receiverTx.amount), // Debit the destination account
        date: new Date(),
        type: "transfer",
        category: "Transfer",
        accountType: receiverTx.accountType, // Original destination account (e.g., checking)
        status: "completed",
        memo: `Refund for transaction ${receiverTx._id}`,
        relatedTransactionId: receiverTx._id,
        transferId: refundSender.transferId, // Same transferId to link the pair
      });

      console.log("DEBUG: Created refund transactions:", {
        sender: JSON.stringify(refundSender, null, 2),
        receiver: JSON.stringify(refundReceiver, null, 2),
      });
      console.log("DEBUG: Created refund transactions:", {
        sender: JSON.stringify(refundSender, null, 2),
        receiver: JSON.stringify(refundReceiver, null, 2),
      });

      refundTransactions.push(refundSender, refundReceiver);

      // Update user balance
      const userId = senderTx.userId._id.toString();
      const userUpdate = usersToUpdate.get(userId) || { balanceChange: 0, savingsBalanceChange: 0 };

      // Credit the source account
      if (senderTx.accountType === "checking") {
        userUpdate.balanceChange += Math.abs(senderTx.amount);
      } else if (senderTx.accountType === "savings") {
        userUpdate.savingsBalanceChange += Math.abs(senderTx.amount);
      }

      // Debit the destination account
      if (receiverTx.accountType === "checking") {
        userUpdate.balanceChange -= Math.abs(receiverTx.amount);
      } else if (receiverTx.accountType === "savings") {
        userUpdate.savingsBalanceChange -= Math.abs(receiverTx.amount);
      }

      usersToUpdate.set(userId, userUpdate);
      console.log(`DEBUG: Updated user balance for ${userId}:`, userUpdate);
    } else {
      // Handle non-internal transfer refunds (Zelle, External, or single transactions)
      for (const originalTransaction of transactions) {
        console.log(`DEBUG: Processing transaction ${originalTransaction._id}...`);

        if (originalTransaction.type === "refund") {
          console.log(`DEBUG: Transaction ${originalTransaction._id} is already a refund`);
          await session.abortTransaction();
          session.endSession();
          return NextResponse.json({ error: "Cannot refund a refund transaction" }, { status: 400 });
        }

        // Check if already refunded
        const existingRefund = await Transaction.findOne({ relatedTransactionId: originalTransaction._id }).session(session);
        if (existingRefund) {
          console.log(`DEBUG: Transaction ${originalTransaction._id} already refunded`);
          await session.abortTransaction();
          session.endSession();
          return NextResponse.json({ error: "Transaction already refunded" }, { status: 400 });
        }

        // Process refund for the transaction
        const refund = new Transaction({
          userId: originalTransaction.userId._id,
          description: `Refund for ${originalTransaction.description}`,
          amount: -originalTransaction.amount,
          date: new Date(),
          type: "refund",
          category: originalTransaction.category,
          accountType: originalTransaction.accountType,
          status: "completed",
          memo: `Refund for transaction ${originalTransaction._id}`,
          relatedTransactionId: originalTransaction._id,
          transferId: originalTransaction.transferId,
        });

        console.log(`DEBUG: Created refund transaction for ${originalTransaction._id}:`, JSON.stringify(refund, null, 2));
        refundTransactions.push(refund);

        // Update user balance
        const userId = originalTransaction.userId._id.toString();
        const userUpdate = usersToUpdate.get(userId) || { balanceChange: 0, savingsBalanceChange: 0 };
        if (originalTransaction.accountType === "checking") {
          userUpdate.balanceChange += -originalTransaction.amount;
        } else if (originalTransaction.accountType === "savings") {
          userUpdate.savingsBalanceChange += -originalTransaction.amount;
        }
        usersToUpdate.set(userId, userUpdate);
        console.log(`DEBUG: Updated user balance for ${userId}:`, userUpdate);
      }
    }

    // Validate sufficient balance for debit operations
    for (const [userId, { balanceChange, savingsBalanceChange }] of usersToUpdate) {
      console.log(`DEBUG: Validating balance for user ${userId}...`);
      if (balanceChange < 0 || savingsBalanceChange < 0) {
        const user = await User.findById(userId).session(session);
        console.log(`DEBUG: Fetched user ${userId}:`, user ? JSON.stringify(user, null, 2) : "Not found");
        if (!user) {
          console.log(`DEBUG: User ${userId} not found`);
          await session.abortTransaction();
          session.endSession();
          return NextResponse.json({ error: `User ${userId} not found` }, { status: 404 });
        }
        const newBalance = (user.balance || 0) + balanceChange;
        const newSavingsBalance = (user.savingsBalance || 0) + savingsBalanceChange;
        console.log(`DEBUG: New balance for ${userId}: Checking: ${newBalance}, Savings: ${newSavingsBalance}`);
        if (newBalance < 0 || newSavingsBalance < 0) {
          console.log(`DEBUG: Insufficient balance for user ${userId}`);
          await session.abortTransaction();
          session.endSession();
          return NextResponse.json({ error: `Insufficient balance for user ${userId}` }, { status: 400 });
        }
      }
    }

    // Save refund transactions
    console.log("DEBUG: Saving refund transactions...");
    await Promise.all(refundTransactions.map((tx) => tx.save({ session })));
    console.log("DEBUG: Refund transactions saved");

    // Update user balances
    console.log("DEBUG: Updating user balances...");
    for (const [userId, { balanceChange, savingsBalanceChange }] of usersToUpdate) {
      const user = await User.findById(userId).session(session);
      if (user) {
        user.balance = (user.balance || 0) + balanceChange;
        user.savingsBalance = (user.savingsBalance || 0) + savingsBalanceChange;
        await user.save({ session });
        console.log(`DEBUG: Updated user ${userId} - Balance: ${user.balance}, Savings: ${user.savingsBalance}`);
      }
    }

    await session.commitTransaction();
    session.endSession();
    console.log("DEBUG: Transaction committed successfully");

    // Prepare response
    const response = {
      message: "Refund processed successfully",
      refundTransactions: refundTransactions.map((tx) => ({
        id: tx._id.toString(),
        userId: tx.userId.toString(),
        userName: tx.userId.fullName || "Unknown",
        userEmail: tx.userId.email || "Unknown",
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
    console.log("DEBUG: Sending response:", JSON.stringify(response, null, 2));

    return NextResponse.json(response);
  } catch (error) {
    console.error("DEBUG: Error processing refund:", error);
    await session.abortTransaction();
    session.endSession();
    return NextResponse.json({ error: "Failed to process refund" }, { status: 500 });
  }
}

// PUT: Update transaction details
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log("DEBUG: Starting PUT handler...");
  await dbConnect();

  const authResponse = await verifyAdminToken(req);
  if (authResponse) return authResponse;

  try {
    const { id } = await params;
    console.log("DEBUG: Updating transaction with ID:", id);
    const body = await req.json();
    console.log("DEBUG: PUT request body:", body);

    const { description, amount, type, status, memo, cryptoAmount, cryptoPrice } = body;

    if (!description || isNaN(amount) || !type || !status) {
      console.log("DEBUG: Invalid input data, returning 400");
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    const transaction = await Transaction.findById(id);
    console.log("DEBUG: Fetched transaction for update:", transaction ? JSON.stringify(transaction, null, 2) : "Not found");

    if (!transaction) {
      console.log("DEBUG: Transaction not found, returning 404");
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    transaction.description = description;
    transaction.amount = amount;
    transaction.type = type;
    transaction.status = status;
    transaction.memo = memo || "";
    transaction.cryptoAmount = cryptoAmount || 0;
    transaction.cryptoPrice = cryptoPrice || 0;

    await transaction.save();
    console.log("DEBUG: Transaction updated:", JSON.stringify(transaction, null, 2));

    let userBalance = 0;
    let userCryptoBalance = 0;
    if (["crypto_buy", "crypto_sell"].includes(type)) {
      const user = await User.findById(transaction.userId);
      console.log("DEBUG: Fetched user for balance update:", user ? JSON.stringify(user, null, 2) : "Not found");
      if (user) {
        if (type === "crypto_buy") {
          user.balance -= amount;
          user.cryptoBalance += cryptoAmount || 0;
        } else if (type === "crypto_sell") {
          user.balance += amount;
          user.cryptoBalance -= cryptoAmount || 0;
        }
        await user.save();
        userBalance = user.balance;
        userCryptoBalance = user.cryptoBalance;
        console.log("DEBUG: Updated user balance:", { userBalance, userCryptoBalance });
      }
    }

    const response = {
      transaction: {
        id: transaction._id.toString(),
        userId: transaction.userId.toString(),
        userName: transaction.userId.fullName || "Unknown",
        userEmail: transaction.userId.email || "Unknown",
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date.toISOString(),
        status: transaction.status,
        account: transaction.accountType,
        memo: transaction.memo || "",
        relatedTransactionId: transaction.relatedTransactionId?.toString(),
        cryptoAmount: transaction.cryptoAmount || 0,
        cryptoPrice: transaction.cryptoPrice || 0,
        transferId: transaction.transferId || "",
      },
      userBalance,
      userCryptoBalance,
    };
    console.log("DEBUG: Sending PUT response:", JSON.stringify(response, null, 2));

    return NextResponse.json(response);
  } catch (error) {
    console.error("DEBUG: Error updating transaction:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}