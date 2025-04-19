import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction"; // You'll need to create this model
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
    const transactions = await Transaction.find({ userId: decoded.userId }).sort({ date: -1 }).limit(10);
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}