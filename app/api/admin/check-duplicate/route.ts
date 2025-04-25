import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import PendingUser from "@/models/pendingUser";

export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse the request body
    const { email, username } = await req.json();

    // Validate that at least one of email or username is provided
    if (!email && !username) {
      return NextResponse.json(
        { error: "At least one of email or username is required" },
        { status: 400 }
      );
    }

    // Build the query based on provided fields
    const query = [];
    if (email) query.push({ email });
    if (username) query.push({ username });

    // Check for duplicates in both users and pendingUsers collections
    const existingUser = await User.findOne({ $or: query });
    const existingPendingUser = await PendingUser.findOne({ $or: query });

    if (existingUser || existingPendingUser) {
      return NextResponse.json(
        {
          error:
            existingUser?.email === email || existingPendingUser?.email === email
              ? "This email is already registered. Please use a different email."
              : "This username is already taken. Please choose a different username.",
        },
        { status: 400 }
      );
    }

    // No duplicates found
    return NextResponse.json({ message: "No duplicates found" }, { status: 200 });
  } catch (error: any) {
    console.error("Duplicate check error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during duplicate check" },
      { status: 500 }
    );
  }
}