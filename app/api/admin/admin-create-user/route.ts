// app/api/admin/admin-create-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "@/models/User";

// Function to generate account numbers
const generateAccountNumber = (prefix: string) => {
  const randomHex = Math.random().toString(16).slice(2, 10).toUpperCase();
  return `${prefix}-${randomHex}`;
};

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: NextRequest) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }

    const token = req.cookies.get("adminToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { adminId: string; role: string };
    } catch (error) {
      return NextResponse.json({ error: "Unauthorized: Invalid Wtoken" }, { status: 401 });
    }

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      fullName,
      email,
      phone,
      ssn,
      streetAddress,
      city,
      state,
      zipCode,
      username,
      password,
      twoFactorEnabled,
      twoFactorCode,
      balance,
      savingsBalance,
      cryptoBalance,
    } = body;

    if (!fullName || !email || !phone || !ssn || !username || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return NextResponse.json({ error: "User with this email or username already exists" }, { status: 409 });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate account numbers
    const accountNumber = generateAccountNumber("CHK");
    const savingsNumber = generateAccountNumber("SAV");
    const cryptoNumber = generateAccountNumber("BTC");

    const newUser = new User({
      fullName,
      email,
      phone,
      ssn,
      streetAddress,
      city,
      state,
      zipCode,
      username,
      password: hashedPassword,
      twoFactorEnabled: twoFactorEnabled || false,
      twoFactorCode: twoFactorCode || "",
      balance: balance || 0,
      savingsBalance: savingsBalance || 0,
      cryptoBalance: cryptoBalance || 0,
      accountNumber,
      savingsNumber,
      cryptoNumber,
      status: "active",
      isVerified: false,
      createdAt: new Date(),
    });

    await newUser.save();

    return NextResponse.json(
      {
        message: "User created successfully",
        userId: newUser._id,
        accountNumber,
        savingsNumber,
        cryptoNumber,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    if (error.name === "TokenExpiredError") {
      return NextResponse.json({ error: "Unauthorized: Token expired" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}