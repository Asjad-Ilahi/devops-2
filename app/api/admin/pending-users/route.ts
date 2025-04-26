import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PendingUser from "@/models/pendingUser";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const pendingUsers = await PendingUser.find({
      isVerified: true, // Email verified
      $or: [
        { adminVerified: false },
        { adminVerified: { $exists: false } } // Include docs where field is missing
      ],
      username: { $ne: "" }, // Ensure step 3 is completed
      password: { $ne: "" }  // Ensure step 3 is completed
    }).select("fullName username email phone ssn streetAddress city state zipCode");

    return NextResponse.json({ pendingUsers }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching pending users:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch pending users" },
      { status: 500 }
    );
  }
}