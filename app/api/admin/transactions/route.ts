import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Interface for the decoded JWT payload
interface IJwtPayload {
  role: string;
  [key: string]: any;
}

// Interface for the User document (populated fields)
interface IUser {
  _id: string;
  fullName?: string;
  email?: string;
  accountNumber?: string;
  savingsNumber?: string;
}

// Interface for the Transaction document
interface ITransaction {
  _id: string;
  userId: IUser;
  amount: number;
  type: string;
  date: Date | string;
  accountType: string;
  status: string;
  description?: string;
  memo?: string;
  transferId?: string;
  __v?: number;
}

// Interface for the processed transaction output
interface IProcessedTransaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  status: string;
  account: string;
  memo: string;
  transferId?: string;
}

// Helper function to check if two dates are within a tolerance window (10 seconds)
const areDatesClose = (date1: Date, date2: Date, windowMs: number = 10000): boolean => {
  return Math.abs(date1.getTime() - date2.getTime()) <= windowMs;
};

export async function GET(req: NextRequest) {
  await dbConnect();

  const token = req.cookies.get("adminToken")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as IJwtPayload;
    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Fetch all transactions and populate user details
    const transactions = await Transaction.find()
      .populate("userId", "fullName email accountNumber savingsNumber")
      .lean() as ITransaction[];

    if (!transactions.length) {
      return NextResponse.json({ transactions: [] }, { status: 200 });
    }

    const processedTransactions: IProcessedTransaction[] = [];
    const processedIds = new Set<string>();

    for (const tx of transactions) {
      const txId = tx._id.toString();
      if (processedIds.has(txId)) continue;

      // Validate required fields
      if (!tx.userId || !tx.userId._id || typeof tx.amount !== "number" || !tx.type || !tx.date || !tx.accountType) {
        console.warn(`Skipping invalid transaction: ${txId}`, {
          hasUserId: !!tx.userId,
          hasAmount: typeof tx.amount === "number",
          hasType: !!tx.type,
          hasDate: !!tx.date,
          hasAccountType: !!tx.accountType,
        });
        continue;
      }

      if (tx.type === "transfer" && tx.transferId) {
        // Look for internal transfer pair (same user, opposite amounts, different accounts)
        const internalPair = transactions.find(
          (otherTx) =>
            otherTx._id.toString() !== txId &&
            otherTx.userId._id.toString() === tx.userId._id.toString() &&
            otherTx.type === "transfer" &&
            otherTx.transferId === tx.transferId &&
            Math.abs(otherTx.amount) === Math.abs(tx.amount) &&
            otherTx.amount === -tx.amount &&
            areDatesClose(new Date(otherTx.date), new Date(tx.date)) &&
            otherTx.accountType !== tx.accountType &&
            !processedIds.has(otherTx._id.toString())
        );

        if (internalPair) {
          const sourceTx = tx.amount < 0 ? tx : internalPair;
          const destTx = tx.amount < 0 ? internalPair : tx;
          const sourceAccount = sourceTx.accountType;
          const destAccount = destTx.accountType;
          const sourceAccountNumber = sourceAccount === "checking" ? sourceTx.userId.accountNumber : sourceTx.userId.savingsNumber;
          const destAccountNumber = destAccount === "checking" ? destTx.userId.accountNumber : destTx.userId.savingsNumber;
          const amount = Math.abs(sourceTx.amount);
          const description = `Transfer from ${sourceAccount} (${sourceAccountNumber || "N/A"}) to ${destAccount} (${destAccountNumber || "N/A"})`;
          const transferId = sourceTx.transferId || `${sourceTx._id}-${destTx._id}`;

          processedTransactions.push({
            id: sourceTx._id.toString(),
            userId: sourceTx.userId._id.toString(),
            userName: sourceTx.userId.fullName || "Unknown User",
            userEmail: sourceTx.userId.email || "N/A",
            type: "transfer",
            amount,
            description,
            date: new Date(sourceTx.date).toISOString(),
            status: sourceTx.status,
            account: sourceAccount,
            memo: sourceTx.memo || "",
            transferId,
          });
          processedIds.add(sourceTx._id.toString());
          processedIds.add(destTx._id.toString());
          continue;
        }

        // Look for external transfer pair (different users, opposite amounts)
        const externalPair = transactions.find(
          (otherTx) =>
            otherTx._id.toString() !== txId &&
            otherTx.userId._id.toString() !== tx.userId._id.toString() &&
            otherTx.type === "transfer" &&
            otherTx.transferId === tx.transferId &&
            Math.abs(otherTx.amount) === Math.abs(tx.amount) &&
            otherTx.amount === -tx.amount &&
            areDatesClose(new Date(otherTx.date), new Date(tx.date)) &&
            !processedIds.has(otherTx._id.toString())
        );

        if (externalPair) {
          const senderTx = tx.amount < 0 ? tx : externalPair;
          const receiverTx = tx.amount < 0 ? externalPair : tx;
          const amount = Math.abs(senderTx.amount);
          const description = `Sent from ${senderTx.userId.fullName || "Unknown User"} to ${receiverTx.userId.fullName || "Unknown User"}`;
          const transferId = senderTx.transferId || `${senderTx._id}-${receiverTx._id}`;

          processedTransactions.push({
            id: senderTx._id.toString(),
            userId: senderTx.userId._id.toString(),
            userName: senderTx.userId.fullName || "Unknown User",
            userEmail: senderTx.userId.email || "N/A",
            type: "transfer",
            amount,
            description,
            date: new Date(senderTx.date).toISOString(),
            status: senderTx.status,
            account: senderTx.accountType,
            memo: senderTx.memo || "",
            transferId,
          });
          processedIds.add(senderTx._id.toString());
          processedIds.add(receiverTx._id.toString());
          continue;
        }
      }

      // Add all transactions (paired or unpaired) as is
      processedTransactions.push({
        id: txId,
        userId: tx.userId._id.toString(),
        userName: tx.userId.fullName || "Unknown User",
        userEmail: tx.userId.email || "N/A",
        type: tx.type,
        amount: tx.amount,
        description: tx.description || `${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} on ${tx.accountType}`,
        date: new Date(tx.date).toISOString(),
        status: tx.status,
        account: tx.accountType,
        memo: tx.memo || "",
        transferId: tx.transferId,
      });
      processedIds.add(txId);
    }

    return NextResponse.json({ transactions: processedTransactions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}