import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { userIds } = await req.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "No user IDs provided" }, { status: 400 });
    }

    // Delete users by IDs
    const result = await User.deleteMany({ _id: { $in: userIds } });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "No users found to delete" }, { status: 404 });
    }

    return NextResponse.json({ message: `Successfully deleted ${result.deletedCount} user(s)` }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting users:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete users" },
      { status: 500 }
    );
  }
}