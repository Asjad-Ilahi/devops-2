import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  await dbConnect();
  // Add admin auth check here (e.g., session verification)
  const { userIds } = await req.json();

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "Invalid user IDs" }, { status: 400 });
  }

  try {
    await User.updateMany(
      { _id: { $in: userIds }, status: "pending" },
      { status: "active" }
    );
    return NextResponse.json({ message: "Users approved" });
  } catch (error) {
    console.error("Bulk approve error:", error);
    return NextResponse.json(
      { error: "Failed to approve users" },
      { status: 500 }
    );
  }
}