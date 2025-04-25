import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();

  // Verify admin token
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

    // Fetch transactions
    const transactions = await Transaction.find({ userId: id })
      .sort({ date: -1 })
      .limit(10);

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();

  // Verify admin token
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
    const { type, amount, description, category, accountType, cryptoAmount, cryptoPrice } = await req.json();

    // Validate required fields
    if (!type || !amount || !description || !category || !accountType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate crypto fields if applicable
    if (["crypto_buy", "crypto_sell"].includes(type)) {
      if (cryptoAmount === undefined || cryptoPrice === undefined || cryptoAmount <= 0 || cryptoPrice <= 0) {
        return NextResponse.json({ error: "Invalid crypto amount or price" }, { status: 400 });
      }
    }

    // Verify user exists
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create transaction
    const transaction = new Transaction({
      userId: id,
      type,
      amount,
      description,
      category,
      accountType,
      status: "completed",
      cryptoAmount: ["crypto_buy", "crypto_sell"].includes(type) ? cryptoAmount : undefined,
      cryptoPrice: ["crypto_buy", "crypto_sell"].includes(type) ? cryptoPrice : undefined,
    });

    // Update user balance based on accountType
    if (accountType === "checking") {
      user.balance = (user.balance || 0) + amount;
    } else if (accountType === "savings") {
      user.savingsBalance = (user.savingsBalance || 0) + amount;
    } else if (accountType === "crypto") {
      user.cryptoBalance = (user.cryptoBalance || 0) + (cryptoAmount || 0);
    }

    await user.save();
    await transaction.save();

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error adding transaction:", error);
    return NextResponse.json({ error: "Failed to add transaction" }, { status: 500 });
  }
}