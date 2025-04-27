import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import RecoveryCode from "@/models/RecoveryCode";
import { sendVerificationEmail } from "@/lib/email";

// Generate a 6-digit recovery code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Use lean() to get a plain JavaScript object
    const admin = await Admin.findOne({ username }).lean();
    console.log("Admin found:", admin);

    if (admin) {
      const email = admin.email;
      console.log("Admin email:", email, "Type:", typeof email);
      if (!email || typeof email !== "string" || email.trim() === "") {
        console.error("Invalid or missing email for admin:", admin.username);
        return NextResponse.json({
          message: "If an account exists with that username, a recovery code has been sent to the associated email.",
        });
      }

      // Delete any existing recovery codes
      await RecoveryCode.deleteMany({ adminId: admin._id });

      // Generate a unique recovery code
      let code;
      let isUnique = false;
      while (!isUnique) {
        code = generateCode();
        const existing = await RecoveryCode.findOne({ code });
        if (!existing) isUnique = true;
      }
      console.log("Recovery code generated:", code, "for admin:", admin.username);

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await RecoveryCode.create({
        adminId: admin._id,
        code,
        expiresAt,
      });

      // Send recovery email
      console.log("Sending recovery email to:", email);
      await sendVerificationEmail(
        email,
        `Your recovery code is: ${code}. It will expire in 15 minutes.`
      );
    }

    // Generic response to prevent username enumeration
    return NextResponse.json({
      message: "If an account exists with that username, a recovery code has been sent to the associated email.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}