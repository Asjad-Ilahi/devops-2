import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import RecoveryCode from "@/models/RecoveryCode";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { code, newPassword } = await request.json();

    // Validate input
    if (!code || !newPassword) {
      return NextResponse.json(
        { error: "Recovery code and new password are required" },
        { status: 400 }
      );
    }

    // Find the recovery code
    const recovery = await RecoveryCode.findOne({ code });
    if (!recovery) {
      return NextResponse.json(
        { error: "Invalid or expired recovery code" },
        { status: 400 }
      );
    }

    // Check if the code has expired
    if (recovery.expiresAt < new Date()) {
      await RecoveryCode.deleteOne({ _id: recovery._id });
      return NextResponse.json(
        { error: "Recovery code has expired" },
        { status: 400 }
      );
    }

    // Find the admin
    const admin = await Admin.findById(recovery.adminId);
    if (!admin) {
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 400 }
      );
    }

    // Update the password
    admin.password = newPassword; // Set the plain password to trigger pre-save hook
    console.log("Updating password for admin:", admin.username);
    await admin.save();
    console.log("Password updated successfully for admin:", admin.username);

    // Delete the used recovery code
    await RecoveryCode.deleteOne({ _id: recovery._id });

    return NextResponse.json({
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}