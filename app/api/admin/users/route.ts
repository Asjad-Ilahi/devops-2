import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Include accountNumber in the select query
    const users = await User.find().select(
      "fullName username email balance status twoFactorEnabled lastLogin accountNumber"
    );
    
    // Map users with actual accountNumber, default to "N/A" if missing
    const usersWithAccount = users.map((user) => ({
      id: user._id.toString(),
      name: user.fullName,
      username: user.username,
      email: user.email,
      accountNumber: user.accountNumber || "N/A", // Use real value or "N/A"
      balance: user.balance || 0,
      status: user.status || "active",
      twoFactorEnabled: user.twoFactorEnabled || false,
      lastLogin: user.lastLogin || "N/A",
    }));

    return NextResponse.json({ users: usersWithAccount }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}