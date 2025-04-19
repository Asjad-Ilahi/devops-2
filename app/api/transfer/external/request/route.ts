import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: NextRequest) {
  await dbConnect();
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const {
      from,
      amount,
      externalBankName,
      externalAccountNumber,
      externalStreet,
      externalCity,
      externalState,
      externalZip,
      externalPhone,
      memo,
    } = await req.json();

    if (
      !from ||
      !amount ||
      !externalBankName ||
      !externalAccountNumber ||
      !externalStreet ||
      !externalCity ||
      !externalState ||
      !externalZip ||
      !externalPhone
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["checking", "savings"].includes(from)) {
      return NextResponse.json({ error: "Invalid source account" }, { status: 400 });
    }

    const sourceBalance = from === "checking" ? user.balance : user.savingsBalance;
    if (sourceBalance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    const verificationCode = crypto.randomBytes(3).toString("hex").toUpperCase();

    user.pendingExternalTransfer = {
      from,
      amount,
      externalBankName,
      externalAccountNumber,
      externalStreet,
      externalCity,
      externalState,
      externalZip,
      externalPhone,
      memo,
      verificationCode,
      createdAt: new Date(),
    };
    await user.save();

    await sendVerificationEmail(user.email, verificationCode);
    return NextResponse.json({ message: "Verification code sent to your email" }, { status: 200 });
  } catch (error) {
    console.error("External transfer request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}