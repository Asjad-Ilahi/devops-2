import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PendingUser from "@/models/pendingUser";
import User from "@/models/User";
import crypto from "crypto";

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

    if (!pendingUser.isVerified) {
      return NextResponse.json({ error: "User email not verified" }, { status: 400 });
    }

    if (pendingUser.adminVerified) {
      return NextResponse.json({ error: "User already approved" }, { status: 400 });
    }

    // Create new user in the User collection
    const newUser = new User({
      fullName: pendingUser.fullName,
      email: pendingUser.email,
      phone: pendingUser.phone,
      ssn: pendingUser.ssn,
      streetAddress: pendingUser.streetAddress,
      city: pendingUser.city,
      state: pendingUser.state,
      zipCode: pendingUser.zipCode,
      username: pendingUser.username,
      password: pendingUser.password,
      isVerified: true,
      accountNumber: `CHK-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      savingsNumber: `SAV-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      cryptoNumber: `BTC-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      balance: 0,
      savingsBalance: 0,
      cryptoBalance: 0,
    });

    await newUser.save();

    // Mark pending user as adminVerified
    pendingUser.adminVerified = true;
    await pendingUser.save();

    // Optionally, delete the pending user
    await PendingUser.deleteOne({ _id: pendingUserId });

    return NextResponse.json({
      message: "User approved successfully",
      accountNumber: newUser.accountNumber,
    }, { status: 200 });
  } catch (error: any) {
    console.error("Approval error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve user" },
      { status: 500 }
    );
  }
}