import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
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

    // Fetch user with all required fields
    const user = await User.findById(id).select(
      "fullName username email phone accountNumber balance savingsNumber savingsBalance cryptoNumber cryptoBalance status twoFactorEnabled lastLogin createdAt"
    );
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Format response
    const userData = {
      id: user._id.toString(),
      fullName: user.fullName || "Unknown",
      name: user.fullName || "Unknown",
      username: user.username || "N/A",
      email: user.email || "N/A",
      phone: user.phone || "N/A",
      phoneNumber: user.phone || "N/A",
      accountNumber: user.accountNumber || "N/A",
      balance: user.balance || 0,
      checkingAccountNumber: user.accountNumber || "N/A",
      checkingBalance: user.balance || 0,
      savingsNumber: user.savingsNumber || "N/A",
      savingsBalance: user.savingsBalance || 0,
      cryptoNumber: user.cryptoNumber || "N/A",
      cryptoBalance: user.cryptoBalance || 0,
      status: user.status || "pending",
      twoFactorEnabled: user.twoFactorEnabled || false,
      lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : "N/A",
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : user._id.getTimestamp().toISOString(),
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { fullName, email, username, phone } = await req.json();

    if (!fullName || !email || !username || !phone) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      id,
      { fullName, email, username, phone },
      { new: true, runValidators: true }
    ).select(
      "fullName username email phone accountNumber balance savingsNumber savingsBalance cryptoNumber cryptoBalance status twoFactorEnabled lastLogin createdAt"
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Format response
    const userData = {
      id: user._id.toString(),
      fullName: user.fullName || "Unknown",
      name: user.fullName || "Unknown",
      username: user.username || "N/A",
      email: user.email || "N/A",
      phone: user.phone || "N/A",
      phoneNumber: user.phone || "N/A",
      accountNumber: user.accountNumber || "N/A",
      balance: user.balance || 0,
      checkingAccountNumber: user.accountNumber || "N/A",
      checkingBalance: user.balance || 0,
      savingsNumber: user.savingsNumber || "N/A",
      savingsBalance: user.savingsBalance || 0,
      cryptoNumber: user.cryptoNumber || "N/A",
      cryptoBalance: user.cryptoBalance || 0,
      status: user.status || "pending",
      twoFactorEnabled: user.twoFactorEnabled || false,
      lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : "N/A",
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : user._id.getTimestamp().toISOString(),
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}