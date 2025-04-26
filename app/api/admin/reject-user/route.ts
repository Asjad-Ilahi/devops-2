import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PendingUser from "@/models/pendingUser";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { pendingUserId } = await req.json();

    if (!pendingUserId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    const pendingUser = await PendingUser.findById(pendingUserId);
    if (!pendingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete the pending user
    await PendingUser.deleteOne({ _id: pendingUserId });

    return NextResponse.json({
      message: "User rejected successfully",
    }, { status: 200 });
  } catch (error: any) {
    console.error("Reject user error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reject user" },
      { status: 500 }
    );
  }
}